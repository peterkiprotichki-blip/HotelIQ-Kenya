import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { mapRecord } from '../../prisma/prisma-mappers';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

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

  async getOccupancy(propertyId: string, fromStr: string, toStr: string) {
    const from = new Date(fromStr);
    const to = new Date(toStr);
    const dates = this.getDatesInRange(from, to);

    // Get total active rooms
    const totalRooms = await this.prisma.room.count({
      where: { propertyId, isActive: true },
    });

    const dailyOccupancy = [];

    for (const d of dates) {
      const nextDay = new Date(d.getTime() + 24 * 60 * 60 * 1000);

      // Find bookings overlapping this day
      const bookedRoomsCount = await this.prisma.booking.count({
        where: {
          propertyId,
          status: { notIn: ['cancelled', 'no_show'] },
          checkIn: { lt: nextDay },
          checkOut: { gt: d },
        },
      });

      const occupancyRate = totalRooms > 0 ? (bookedRoomsCount / totalRooms) * 100 : 0;
      dailyOccupancy.push({
        date: d.toISOString().split('T')[0],
        bookedRooms: bookedRoomsCount,
        totalRooms,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
      });
    }

    return dailyOccupancy;
  }

  async getRevenue(propertyId: string, fromStr: string, toStr: string) {
    const from = new Date(fromStr);
    const to = new Date(toStr);
    const dates = this.getDatesInRange(from, to);

    const dailyRevenue = [];
    let totalRevenue = 0;

    for (const d of dates) {
      const nextDay = new Date(d.getTime() + 24 * 60 * 60 * 1000);

      // Find bookings overlapping this day
      const activeBookings = await this.prisma.booking.findMany({
        where: {
          propertyId,
          status: { notIn: ['cancelled', 'no_show'] },
          checkIn: { lt: nextDay },
          checkOut: { gt: d },
        },
      });

      let dayRevenue = 0;
      for (const b of activeBookings) {
        dayRevenue += b.pricePerNight;
      }

      totalRevenue += dayRevenue;
      dailyRevenue.push({
        date: d.toISOString().split('T')[0],
        revenue: dayRevenue,
      });
    }

    return {
      totalRevenue,
      breakdown: dailyRevenue,
    };
  }

  async getUpcoming(propertyId: string) {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const bookings = await this.prisma.booking.findMany({
      where: {
        propertyId,
        OR: [
          {
            checkIn: { gte: now, lte: sevenDaysFromNow },
          },
          {
            checkOut: { gte: now, lte: sevenDaysFromNow },
          },
        ],
      },
      orderBy: { checkIn: 'asc' },
    });

    const enriched = [];
    for (const b of bookings) {
      const room = await this.prisma.room.findUnique({ where: { id: b.roomId } });
      enriched.push({
        ...mapRecord(b),
        roomNumber: room?.roomNumber || 'Unknown',
        roomType: room?.roomType || 'Unknown',
      });
    }

    return enriched;
  }

  async getSummary(propertyId: string) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Get today's occupancy
    const occupancyList = await this.getOccupancy(propertyId, todayStr, todayStr);
    const todayOccupancy = occupancyList[0]?.occupancyRate || 0;

    // Get this month's revenue
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const revenueData = await this.getRevenue(propertyId, startOfMonth.toISOString(), endOfMonth.toISOString());
    const monthlyRevenue = revenueData.totalRevenue;

    // Get next 5 upcoming check-ins/outs
    const upcoming = await this.getUpcoming(propertyId);
    const nextFive = upcoming.slice(0, 5);

    // Get latest AI insight from database logs
    const latestSuggestion = await this.prisma.pricingSuggestion.findFirst({
      where: { propertyId },
      orderBy: { generatedAt: 'desc' },
    });

    let aiInsight = 'AI pricing system is active. Run a price check to receive demand insights.';
    if (latestSuggestion) {
      aiInsight = `Insight for ${latestSuggestion.roomType} on ${latestSuggestion.date.toISOString().split('T')[0]}: ${latestSuggestion.reasoning}. Suggested price: ${latestSuggestion.suggestedPrice} KES (Base: ${latestSuggestion.basePrice} KES)`;
    }

    return {
      occupancyRate: todayOccupancy,
      monthlyRevenue,
      upcomingBookings: nextFive,
      aiInsight,
    };
  }
}
