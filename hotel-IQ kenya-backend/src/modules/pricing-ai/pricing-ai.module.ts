import { Module } from '@nestjs/common';
import { PricingAiService } from './pricing-ai.service';
import { PricingRulesService } from './pricing-rules.service';
import { PricingAiController } from './pricing-ai.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PricingAiController],
  providers: [PricingAiService, PricingRulesService],
  exports: [PricingAiService, PricingRulesService],
})
export class PricingAiModule {}
