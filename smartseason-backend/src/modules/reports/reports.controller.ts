import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsAiService } from './reports-ai.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsAiService: ReportsAiService) {}

  @Post('ai/analysis')
  @Roles('super_admin', 'admin', 'manager', 'agent')
  analyze(@Body() body: { focus?: string }) {
    return this.reportsAiService.generateReportInsights(body?.focus);
  }
}