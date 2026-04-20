import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsAiService } from './reports-ai.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsAiService],
})
export class ReportsModule {}