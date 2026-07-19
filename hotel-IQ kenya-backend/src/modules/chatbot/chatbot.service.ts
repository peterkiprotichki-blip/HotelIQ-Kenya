import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingRulesService } from '../pricing-ai/pricing-rules.service';
import { mapRecord, mapRecords } from '../../prisma/prisma-mappers';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly pricingRulesService: PricingRulesService,
  ) {}

  private GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];

  private async callGemini(systemPrompt: string, userMessage: string, history?: { role: string; content: string }[]): Promise<string | null> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) return null;

    const contents: any[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. I will answer concisely using the data provided.' }] },
    ];

    if (history?.length) {
      for (const h of history) {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        });
      }
    }

    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    for (const model of this.GEMINI_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
            }),
          },
        );

        if (response.ok) {
          const payload = await response.json();
          const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text?.trim()) return text.trim();
        }

        if (response.status === 429) {
          this.logger.warn(`Gemini rate limit hit for ${model}, trying next model`);
          continue;
        }
      } catch (err) {
        this.logger.warn(`Gemini fetch error for ${model}: ${err}`);
        continue;
      }
    }

    return null;
  }

  async chat(dto: { message: string; propertyId?: string; context?: { role: 'user' | 'assistant'; content: string }[]; userLat?: number; userLng?: number }) {
    const systemPrompt = await this.buildSystemPrompt(dto.propertyId);
    const geminiReply = await this.callGemini(systemPrompt, dto.message, dto.context);

    if (geminiReply) {
      return { reply: geminiReply, poweredBy: 'gemini' };
    }

    const fallbackReply = await this.ruleBasedReply(dto.message, dto.propertyId, dto.userLat, dto.userLng);
    return { reply: fallbackReply, poweredBy: 'local' };
  }

  async compareRooms(dto: { propertyId: string; checkIn: string; checkOut: string }) {
    const property = await this.prisma.property.findUnique({ where: { id: dto.propertyId } });
    if (!property || !property.isActive) return { reply: 'Property not found.' };

    const rooms = await this.prisma.room.findMany({
      where: { propertyId: dto.propertyId, isActive: true },
      orderBy: { basePrice: 'asc' },
    });

    if (!rooms.length) return { reply: 'No rooms available at this lodge.' };

    const checkInDate = new Date(dto.checkIn);
    const diffMs = new Date(dto.checkOut).getTime() - checkInDate.getTime();
    const nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const comparisons: any[] = [];
    for (const room of rooms) {
      const rule = await this.pricingRulesService.computePricingRule(dto.propertyId, room.roomType, checkInDate);
      const perNight = rule.suggestedPrice;
      const total = perNight * nights;
      const originalTotal = room.basePrice * nights;
      const savings = originalTotal - total;

      comparisons.push({
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        capacity: room.capacity,
        amenities: room.amenities,
        basePrice: room.basePrice,
        suggestedPrice: perNight,
        demandScore: rule.demandScore,
        factorsUsed: rule.factorsUsed,
        totalForStay: total,
        savings,
        reasoning: rule.reasoning,
      });
    }

    const comparisonText = comparisons
      .map((c) => `Room ${c.roomNumber} (${c.roomType}): ${c.basePrice} KES base → ${c.suggestedPrice} KES/night. ${c.totalForStay} KES total. ${c.amenities.join(', ')}.${c.savings > 0 ? ` Save ${c.savings} KES.` : ''}`)
      .join('\n');

    const systemPrompt = `You are a booking assistant for ${property.name} in ${property.town}, Kenya. Guest is staying ${nights} nights (${dto.checkIn} to ${dto.checkOut}). Compare rooms helpfully.`;
    const userPrompt = `Compare these rooms:\n${comparisonText}\nGive a friendly 2-3 sentence overview of best value and why prices differ.`;

    const geminiReply = await this.callGemini(systemPrompt, userPrompt);

    if (geminiReply) {
      return { reply: geminiReply, comparisons, poweredBy: 'gemini' };
    }

    const fallback = this.buildComparisonFallback(comparisons, nights, property.name);
    return { reply: fallback, comparisons, poweredBy: 'local' };
  }

  private buildComparisonFallback(comparisons: any[], nights: number, propertyName: string): string {
    if (!comparisons.length) return 'No rooms to compare.';

    const cheapest = comparisons[0];
    const bestValue = [...comparisons].sort((a, b) => b.savings - a.savings)[0];
    const mostLuxurious = [...comparisons].sort((a, b) => b.capacity + b.amenities.length - (a.capacity + a.amenities.length))[0];

    const lines = [`Here's a comparison of rooms at ${propertyName} for ${nights} night(s):\n`];

    for (const c of comparisons) {
      const factors = c.factorsUsed.length
        ? ` (due to: ${c.factorsUsed.join(', ')})`
        : '';
      lines.push(`• ${c.roomType} Room ${c.roomNumber}: ${c.suggestedPrice.toLocaleString()} KES/night → ${c.totalForStay.toLocaleString()} KES total${factors}`);
    }

    lines.push(`\nBest value: ${bestValue.roomType} Room ${bestValue.roomNumber} at ${bestValue.suggestedPrice.toLocaleString()} KES/night.`);
    if (cheapest.suggestedPrice < mostLuxurious.suggestedPrice) {
      lines.push(`Budget pick: ${cheapest.roomType} Room ${cheapest.roomNumber} at ${cheapest.suggestedPrice.toLocaleString()} KES/night.`);
    }
    lines.push(`Most luxurious: ${mostLuxurious.roomType} Room ${mostLuxurious.roomNumber} with ${mostLuxurious.amenities.length} amenities, capacity ${mostLuxurious.capacity}.`);

    return lines.join('\n');
  }

  private async ruleBasedReply(message: string, propertyId?: string, userLat?: number, userLng?: number): Promise<string> {
    const msg = message.toLowerCase();

    if (this.matches(msg, ['hello', 'hi', 'hey', 'greetings', 'jambo', 'habari'])) {
      return 'Jambo! I\'m your HotelIQ assistant. I can help you compare room prices, find nearby events, or recommend the best lodge for your stay. What would you like to know?';
    }

    const entityResult = await this.searchEntities(message);
    if (entityResult) return entityResult;

    if (this.matches(msg, ['cheapest', 'cheap', 'budget', 'affordable', 'lowest']) && this.matches(msg, ['lodge', 'hotel', 'property', 'place', 'loadge'])) {
      const properties = await this.prisma.property.findMany({ where: { isActive: true } });
      if (!properties.length) return 'No lodges available right now.';

      let cheapestProp: any = null;
      let cheapestPrice = Infinity;

      for (const p of properties) {
        const rooms = await this.prisma.room.findMany({
          where: { propertyId: p.id, isActive: true },
          orderBy: { basePrice: 'asc' },
        });
        if (rooms.length && rooms[0].basePrice < cheapestPrice) {
          cheapestPrice = rooms[0].basePrice;
          cheapestProp = { ...p, cheapestRoom: rooms[0] };
        }
      }

      if (!cheapestProp) return 'No rooms available at any lodge right now.';

      return `The most affordable lodge is ${cheapestProp.name} in ${cheapestProp.town}, ${cheapestProp.county} with rooms starting at ${cheapestProp.cheapestRoom.basePrice.toLocaleString()} KES/night (${cheapestProp.cheapestRoom.roomType}).\n\nRooms in Eldoret (4,500 KES) are generally cheaper than Mombasa (5,000 KES). You can also save by booking during weekdays when demand is lower.`;
    }

    if (this.matches(msg, ['compare', 'comparison', 'best room', 'which room', 'cheapest', 'most expensive', 'best value'])) {
      if (propertyId) {
        return 'I can compare rooms for you! Click the "Compare all room types" button above, or ask me about a specific room type and I\'ll explain its pricing.';
      }
      return 'To compare rooms, please select a lodge first from the map or lodge cards. Then I can give you a detailed price comparison!';
    }

    if (this.matches(msg, ['event', 'events', 'festival', 'marathon', 'holiday', 'conference', 'nearby'])) {
      const events = await this.prisma.kenyanEvent.findMany({
        where: { endDate: { gte: new Date() } },
        orderBy: { startDate: 'asc' },
        take: 5,
      });

      if (!events.length) return 'There are no upcoming events listed right now. Check back soon!';

      const sorted = userLat != null && userLng != null
        ? [...events].sort((a, b) => this.haversineKm(userLat, userLng, a.latitude, a.longitude) - this.haversineKm(userLat, userLng, b.latitude, b.longitude))
        : events;

      const lines = ['Here are upcoming events in Kenya:\n'];
      for (const e of sorted) {
        const date = e.startDate.toISOString().split('T')[0];
        const distStr = userLat != null && userLng != null
          ? ` — ${Math.round(this.haversineKm(userLat, userLng, e.latitude, e.longitude))} km away`
          : '';
        lines.push(`• ${e.name} - ${date} in ${e.town}, ${e.county} (${e.category}, ${e.demandImpact} demand)${distStr}`);
      }
      return lines.join('\n');
    }

    if (this.matches(msg, ['price', 'pricing', 'cost', 'rate', 'how much', 'expensive', 'cheap'])) {
      if (propertyId) {
        const rooms = await this.prisma.room.findMany({
          where: { propertyId, isActive: true },
          orderBy: { basePrice: 'asc' },
        });
        if (!rooms.length) return 'No rooms are available at this lodge right now.';

        const lines = ['Current room rates at this lodge:\n'];
        for (const r of rooms) {
          lines.push(`• ${r.roomType} Room ${r.roomNumber}: ${r.basePrice.toLocaleString()} KES/night — ${r.amenities.join(', ')} (capacity: ${r.capacity})`);
        }
        lines.push('\nPrices may vary based on weekends, events, and demand. Ask me to compare prices for your dates!');
        return lines.join('\n');
      }
      return 'We have lodges with rooms ranging from about 4,500 KES to 15,000 KES per night depending on the location, room type, and season. Select a lodge to see specific pricing!';
    }

    if (this.matchAny(msg, ['around me', 'near me', 'nearby', 'close to me', 'closest'])) {
      if (userLat == null || userLng == null) {
        return 'I don\'t have your location yet. Please allow location access in your browser so I can show you nearby lodges and events.';
      }

      const properties = await this.prisma.property.findMany({ where: { isActive: true } });
      const sortedProps = [...properties].sort((a, b) => this.haversineKm(userLat, userLng, a.latitude, a.longitude) - this.haversineKm(userLat, userLng, b.latitude, b.longitude));

      const closestLodge = sortedProps[0];
      const lodgeDist = Math.round(this.haversineKm(userLat, userLng, closestLodge.latitude, closestLodge.longitude));

      const events = await this.prisma.kenyanEvent.findMany({
        where: { endDate: { gte: new Date() } },
      });
      const sortedEvents = [...events]
        .sort((a, b) => this.haversineKm(userLat, userLng, a.latitude, a.longitude) - this.haversineKm(userLat, userLng, b.latitude, b.longitude))
        .slice(0, 3);

      const lines = [`The closest lodge to you is ${closestLodge.name} in ${closestLodge.town}, ${closestLodge.county} — ${lodgeDist} km away.`];

      if (sortedProps.length > 1) {
        lines.push(`\nOther lodges nearby:`);
        for (const p of sortedProps.slice(1)) {
          lines.push(`• ${p.name} — ${p.town}, ${p.county} — ${Math.round(this.haversineKm(userLat, userLng, p.latitude, p.longitude))} km away`);
        }
      }

      if (sortedEvents.length > 0) {
        lines.push(`\nEvents near you:`);
        for (const e of sortedEvents) {
          const date = e.startDate.toISOString().split('T')[0];
          lines.push(`• ${e.name} — ${date}, ${e.town}, ${e.county} — ${Math.round(this.haversineKm(userLat, userLng, e.latitude, e.longitude))} km away`);
        }
      }

      return lines.join('\n');
    }

    if (this.matches(msg, ['lodge', 'lodges', 'hotel', 'hotels', 'property', 'properties', 'available', 'list'])) {
      const properties = await this.prisma.property.findMany({ where: { isActive: true } });
      if (!properties.length) return 'No lodges are available at the moment. Please check back later.';

      const sorted = userLat != null && userLng != null
        ? [...properties].sort((a, b) => this.haversineKm(userLat, userLng, a.latitude, a.longitude) - this.haversineKm(userLat, userLng, b.latitude, b.longitude))
        : properties;

      const lines = ['We have these lodges in Kenya:\n'];
      for (const p of sorted) {
        const distStr = userLat != null && userLng != null
          ? ` (${Math.round(this.haversineKm(userLat, userLng, p.latitude, p.longitude))} km away)`
          : '';
        lines.push(`• ${p.name} — ${p.town}, ${p.county}${distStr} — ${p.address} — Call: ${p.contactPhone}`);
      }
      lines.push('\nSelect a lodge to see its rooms and prices!');
      return lines.join('\n');
    }

    if (this.matches(msg, ['amenities', 'wifi', 'tv', 'ac', 'jacuzzi', 'bar', 'mini'])) {
      return 'Our rooms come with various amenities:\n• Standard rooms: WiFi, TV, AC\n• Deluxe rooms: WiFi, TV, AC, Mini Bar\n• Executive Suites: WiFi, TV, AC, Mini Bar, Jacuzzi\n\nHigher-tier rooms cost more but offer more comfort. Ask me to compare specific rooms!';
    }

    if (this.matches(msg, ['capacity', 'people', 'family', 'group', 'how many', 'sleep'])) {
      return 'Room capacities:\n• Standard rooms: 2 people\n• Deluxe rooms: 3 people\n• Executive Suites: 4 people\n\nFor families or groups, I recommend Executive Suites or booking multiple Standard rooms. Would you like me to compare prices for your group size?';
    }

    if (this.matches(msg, ['thank', 'thanks', 'asante'])) {
      return 'Karibu sana! You\'re welcome. Is there anything else I can help with? Feel free to ask about rooms, prices, or events anytime!';
    }

    if (this.matches(msg, ['help', 'what can you do', 'capabilities'])) {
      return 'I can help you with:\n• Comparing room prices at any lodge\n• Finding the best value room for your budget\n• Listing upcoming events near the lodges\n• Explaining why prices change (weekends, events, demand)\n• Recommending rooms based on your needs (family, budget, luxury)\n\nJust ask me anything about the lodges, rooms, or events!';
    }

    if (propertyId) {
      return 'I can tell you about the rooms, prices, and amenities at this lodge. Try asking:\n• "Compare all room types"\n• "Which room is best for a family?"\n• "Are there events nearby?"\n• "Why do prices change?"';
    }

    return 'I\'d love to help! You can ask me about:\n• Available lodges and their locations\n• Room types, prices, and amenities\n• Upcoming events in Kenya\n• Price comparisons and best value picks\n\nSelect a lodge from the map and I can give you detailed room pricing!';
  }

  private matches(text: string, keywords: string[]): boolean {
    return keywords.some((kw) => {
      if (kw.includes(' ')) {
        return text.includes(kw);
      }

      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(text)) return true;

      if (kw.length >= 5) {
        const words = text.split(/\s+/);
        return words.some((w) => this.fuzzyDistance(w, kw) <= 2);
      }

      return false;
    });
  }

  private matchAny(text: string, phrases: string[]): boolean {
    return phrases.some((p) => text.includes(p));
  }

  private fuzzyDistance(a: string, b: string): number {
    if (Math.abs(a.length - b.length) > 3) return 99;

    const dp: number[][] = [];
    for (let i = 0; i <= a.length; i++) {
      dp[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        );
      }
    }

    return dp[a.length][b.length];
  }

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async searchEntities(message: string): Promise<string | null> {
    const genericWords = new Set(['lodge', 'hotel', 'hotle', 'property', 'inn', 'hotl']);
    const terms = [message, ...message.split(/\s+/).filter((w) => w.length >= 3 && !genericWords.has(w.toLowerCase()))];

    for (const term of [...new Set(terms)]) {
      const eventResult = await this.findEvent(term);
      if (eventResult) return eventResult;

      const propertyResult = await this.findProperty(term);
      if (propertyResult) return propertyResult;
    }

    return null;
  }

  private async findEvent(query: string): Promise<string | null> {
    const events = await this.prisma.kenyanEvent.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      take: 5,
    });

    if (events.length === 0 || events.length > 2) return null;

    for (const event of events) {
      const nameLower = event.name.toLowerCase();
      const qLower = query.toLowerCase();
      const nameWords = nameLower.split(/\s+/);
      const qWords = qLower.split(/\s+/);
      const hasMatch = nameLower.includes(qLower) ||
        qLower.includes(nameLower) ||
        qWords.some((qw) => qw.length >= 3 && nameWords.some((nw) => this.fuzzyDistance(qw, nw) <= 2));

      if (hasMatch) {
        const date = event.startDate.toISOString().split('T')[0];
        const endDate = event.endDate.toISOString().split('T')[0];
        return [
          `${event.name}`,
          ``,
          `Date: ${date}${endDate !== date ? ` to ${endDate}` : ''}`,
          `Location: ${event.town}, ${event.county}`,
          `Category: ${event.category}`,
          `Demand Impact: ${event.demandImpact}`,
          event.description ? `` : '',
          event.description || '',
          event.isNational ? `This is a national event affecting lodges across Kenya.` : `This is a local event, mainly affecting lodges in ${event.county} and nearby areas.`,
          ``,
          `During ${event.demandImpact}-demand events like this, room prices may increase by ${event.demandImpact === 'high' ? 'up to 25%' : event.demandImpact === 'medium' ? 'around 12%' : 'about 5%'}. Book early to secure the best rates!`,
        ].join('\n');
      }
    }

    return null;
  }

  private async findProperty(query: string): Promise<string | null> {
    const properties = await this.prisma.property.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { town: { contains: query, mode: 'insensitive' } },
          { county: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    if (properties.length === 0 || properties.length > 2) return null;

    for (const p of properties) {
      const nameLower = p.name.toLowerCase();
      const townLower = p.town.toLowerCase();
      const countyLower = p.county.toLowerCase();
      const qLower = query.toLowerCase();
      const propWords = `${nameLower} ${townLower} ${countyLower}`.split(/\s+/);
      const qWords = qLower.split(/\s+/);
      const hasMatch = nameLower.includes(qLower) ||
        townLower.includes(qLower) ||
        countyLower.includes(qLower) ||
        qLower.includes(nameLower) ||
        qWords.some((qw) => qw.length >= 3 && propWords.some((pw) => this.fuzzyDistance(qw, pw) <= 2));

      if (hasMatch) {
        const rooms = await this.prisma.room.findMany({
          where: { propertyId: p.id, isActive: true },
          orderBy: { basePrice: 'asc' },
        });

        const lines = [
          `${p.name}`,
          `Location: ${p.town}, ${p.county}`,
          `Address: ${p.address}`,
          `Phone: ${p.contactPhone}`,
          ``,
          rooms.length ? `Available rooms (${rooms.length}):` : 'No rooms currently listed.',
        ];

        for (const r of rooms) {
          lines.push(`• ${r.roomType} Room ${r.roomNumber}: ${r.basePrice.toLocaleString()} KES/night (capacity: ${r.capacity})`);
        }

        return lines.join('\n');
      }
    }

    return null;
  }

  private async buildSystemPrompt(propertyId?: string): Promise<string> {
    let prompt = `You are the HotelIQ Assistant for a Kenyan hotel booking platform. Be warm, friendly, and conversational. Use Kenyan hospitality tone ("Jambo", "Karibu"). Keep responses under 3-4 sentences. Mention prices in KES, specific amenities, and event names when relevant. Always be helpful.`;

    if (propertyId) {
      const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
      if (property?.isActive) {
        const rooms = await this.prisma.room.findMany({
          where: { propertyId, isActive: true },
          orderBy: { basePrice: 'asc' },
        });
        prompt += `\nGuest is viewing ${property.name} in ${property.town}, ${property.county} (${property.address}, phone ${property.contactPhone}).`;
        prompt += `Rooms: ${rooms.map((r) => `${r.roomType} Room ${r.roomNumber}: ${r.basePrice} KES/night, capacity ${r.capacity}, amenities: ${r.amenities.join(', ')}`).join(' | ')}.`;

        const events = await this.prisma.kenyanEvent.findMany({
          where: { endDate: { gte: new Date() } },
          orderBy: { startDate: 'asc' },
          take: 5,
        });
        if (events.length) {
          prompt += ` Events: ${events.map((e) => `${e.name} (${e.town}, ${e.startDate.toISOString().split('T')[0]}, ${e.demandImpact} demand)`).join(' | ')}.`;
        }
      }
    } else {
      const properties = await this.prisma.property.findMany({ where: { isActive: true } });
      if (properties.length) {
        prompt += ` Lodges: ${properties.map((p) => `${p.name} in ${p.town}, ${p.county} (${p.contactPhone})`).join(' | ')}.`;
      }
    }

    return prompt;
  }
}
