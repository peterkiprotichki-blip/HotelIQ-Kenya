import { Controller, Get, Post, Body, Query, Param, Req, UseGuards } from '@nestjs/common';
import { PricingAiService } from './pricing-ai.service';
import { GenerateSuggestionDto } from './dto/generate-suggestion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Pricing AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pricing-ai')
export class PricingAiController {
  constructor(private readonly pricingAiService: PricingAiService) {}

  @Post('suggest')
  suggest(@Body() dto: GenerateSuggestionDto) {
    return this.pricingAiService.generateSuggestions(
      dto.propertyId,
      dto.roomType,
      dto.from,
      dto.to,
    );
  }

  @Get('history')
  getHistory(
    @Query('propertyId') propertyId: string,
    @Query('roomType') roomType: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.pricingAiService.getHistory(propertyId, roomType, from, to);
  }

  @Post('apply/:suggestionId')
  applySuggestion(@Param('suggestionId') suggestionId: string, @Req() req) {
    return this.pricingAiService.applySuggestion(suggestionId, req.user.sub);
  }
}
