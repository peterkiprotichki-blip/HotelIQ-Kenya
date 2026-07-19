import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EventsModule } from './modules/events/events.module';
import { MapModule } from './modules/map/map.module';
import { PricingAiModule } from './modules/pricing-ai/pricing-ai.module';
import { PublicModule } from './modules/public/public.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    PropertiesModule,
    RoomsModule,
    BookingsModule,
    DashboardModule,
    EventsModule,
    MapModule,
    PricingAiModule,
    PublicModule,
    ChatbotModule,
  ],
})
export class AppModule {}
