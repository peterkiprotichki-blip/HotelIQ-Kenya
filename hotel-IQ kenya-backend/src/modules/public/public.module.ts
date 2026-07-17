import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { BookingsModule } from '../bookings/bookings.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PrismaModule, BookingsModule, EventsModule],
  controllers: [PublicController],
})
export class PublicModule {}
