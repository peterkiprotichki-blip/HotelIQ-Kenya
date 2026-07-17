import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingRulesService } from './pricing-rules.service';
import { mapRecord } from '../../prisma/prisma-mappers';

@Injectable()
export class PricingAiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly pricingRulesService: PricingRulesService,
  ) {}

  private getDatesInRange(startDate: Date, endDate: Date): Date[] {
    const dates = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    const targetDate = new Date(endDate);
    targetDate.setHours(0, 0, 0, 0);

    while (currentDate <= targetDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  }

  async generateSuggestions(propertyId: string, roomType: string, fromStr: string, toStr: string) {
    const from = new Date(fromStr);
    const to = new Date(toStr);
    const dates = this.getDatesInRange(from, to);

    const suggestions = [];

    for (const d of dates) {
      // Step 1: Compute Tier 1 rules
      const ruleResult = await this.pricingRulesService.computePricingRule(propertyId, roomType, d);

      // Step 2: Try to get Tier 2 LLM explanation
      let finalReasoning = ruleResult.reasoning;
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');

      if (apiKey && ruleResult.factorsUsed.length > 0) {
        try {
          const model = 'gemini-2.0-flash';
          const prompt = `You are a pricing assistant for a small Kenyan hotel owner.
Given this data:
Date: ${d.toISOString().split('T')[0]}
Room Type: ${roomType}
Base Price: ${ruleResult.basePrice} KES
Suggested Price: ${ruleResult.suggestedPrice} KES
Adjustment Factors: ${ruleResult.factorsUsed.join(', ')}

Explain this suggested price adjustment in 2-3 plain, friendly sentences that a guesthouse owner would easily understand. Keep it brief. Do not use technical jargon or markdown formatting. Return only the plain explanation.`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: prompt }],
                  },
                ],
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 200,
                },
              }),
            },
          );

          if (response.ok) {
            const payload = await response.json();
            const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim()) {
              finalReasoning = text.trim();
            }
          }
        } catch (err) {
          // Silent fallback to Tier 1 reasoning on Gemini failure
          console.warn('Gemini pricing explanation failed, falling back to rule reasoning', err);
        }
      }

      // Step 3: Persist suggestion
      const dateOnly = new Date(d);
      dateOnly.setHours(0, 0, 0, 0);

      const existing = await this.prisma.pricingSuggestion.findFirst({
        where: {
          propertyId,
          roomType,
          date: {
            gte: dateOnly,
            lt: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      let savedSuggestion;
      if (existing) {
        savedSuggestion = await this.prisma.pricingSuggestion.update({
          where: { id: existing.id },
          data: {
            suggestedPrice: ruleResult.suggestedPrice,
            basePrice: ruleResult.basePrice,
            demandScore: ruleResult.demandScore,
            reasoning: finalReasoning,
            factorsUsed: ruleResult.factorsUsed,
          },
        });
      } else {
        savedSuggestion = await this.prisma.pricingSuggestion.create({
          data: {
            propertyId,
            roomType,
            date: dateOnly,
            suggestedPrice: ruleResult.suggestedPrice,
            basePrice: ruleResult.basePrice,
            demandScore: ruleResult.demandScore,
            reasoning: finalReasoning,
            factorsUsed: ruleResult.factorsUsed,
          },
        });
      }

      suggestions.push(mapRecord(savedSuggestion));
    }

    return suggestions;
  }

  async getHistory(propertyId: string, roomType: string, from?: string, to?: string) {
    const where: any = { propertyId, roomType };

    if (from || to) {
      where.date = {};
      if (from) {
        where.date.gte = new Date(from);
      }
      if (to) {
        where.date.lte = new Date(to);
      }
    }

    const suggestions = await this.prisma.pricingSuggestion.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return suggestions.map(mapRecord);
  }

  async applySuggestion(suggestionId: string, ownerId: string) {
    const suggestion = await this.prisma.pricingSuggestion.findUnique({
      where: { id: suggestionId },
    });
    if (!suggestion) {
      throw new NotFoundException('Pricing suggestion not found');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: suggestion.propertyId },
    });
    if (!property || property.ownerId !== ownerId) {
      throw new BadRequestException('You do not own the property for this suggestion');
    }

    // Apply the price to all rooms of this type
    const rooms = await this.prisma.room.findMany({
      where: { propertyId: suggestion.propertyId, roomType: suggestion.roomType, isActive: true },
    });

    for (const r of rooms) {
      await this.prisma.room.update({
        where: { id: r.id },
        data: { basePrice: suggestion.suggestedPrice },
      });
    }

    return {
      success: true,
      message: `Successfully applied suggested price of ${suggestion.suggestedPrice} KES to all active ${suggestion.roomType} rooms.`,
    };
  }
}
