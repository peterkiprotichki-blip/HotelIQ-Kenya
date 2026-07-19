import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { PricingAiModule } from '../pricing-ai/pricing-ai.module';

@Module({
  imports: [PrismaModule, PricingAiModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
