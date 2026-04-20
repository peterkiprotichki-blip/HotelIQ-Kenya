import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { mapRecord } from '../../prisma/prisma-mappers';

type FieldInsight = {
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  concerns: string[];
  recommendedActions: string[];
  followUpQuestion?: string;
};

@Injectable()
export class FieldAiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async generateFieldInsights(fieldId: string, focus?: string) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('GEMINI_API_KEY is not configured');
    }

    const field = await this.prisma.field.findUnique({ where: { id: fieldId } });
    if (!field || field.isDeleted) {
      throw new BadRequestException('Field not found');
    }

    const prompt = this.buildPrompt(mapRecord(field), focus);
    const model = 'gemini-2.0-flash';
    let insights: FieldInsight;
    let source: 'gemini' | 'fallback' = 'gemini';

    try {
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
              maxOutputTokens: 700,
              responseMimeType: 'application/json',
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
      }

      const payload = await response.json();
      const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini returned an empty response');
      }

      insights = this.parseInsights(text);
    } catch (error) {
      source = 'fallback';
      insights = this.buildFallbackInsights(mapRecord(field), focus);
    }

    return {
      field: mapRecord(field),
      insights,
      source,
      model,
    };
  }

  private buildPrompt(field: any, focus?: string) {
    const details = {
      name: field.name,
      cropType: field.cropType,
      location: field.location,
      stage: field.currentStage,
      status: field.status,
      plantingDate: field.plantingDate,
      expectedHarvestDate: field.expectedHarvestDate,
      notes: field.notes?.slice?.(0, 10) || [],
      focus: focus || 'General field health, productivity, and next operational actions.',
    };

    return [
      'You are an agricultural field advisor for SmartSeason.',
      'Return strict JSON only with these keys:',
      '{"summary":"string","riskLevel":"low|medium|high","concerns":["string"],"recommendedActions":["string"],"followUpQuestion":"string optional"}',
      'Keep the summary concise and practical.',
      'Use the field context below and do not include markdown, code fences, or extra keys.',
      JSON.stringify(details, null, 2),
    ].join('\n\n');
  }

  private parseInsights(text: string): FieldInsight {
    try {
      const parsed = JSON.parse(text);
      return {
        summary: String(parsed.summary || '').trim(),
        riskLevel: this.normalizeRiskLevel(parsed.riskLevel),
        concerns: this.normalizeStringArray(parsed.concerns),
        recommendedActions: this.normalizeStringArray(parsed.recommendedActions),
        followUpQuestion: parsed.followUpQuestion ? String(parsed.followUpQuestion).trim() : undefined,
      };
    } catch {
      return {
        summary: text.trim(),
        riskLevel: 'medium',
        concerns: [],
        recommendedActions: [],
      };
    }
  }

  private buildFallbackInsights(field: any, focus?: string): FieldInsight {
    const hasHarvestPressure = field.expectedHarvestDate
      ? (new Date(field.expectedHarvestDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000) <= 14
      : false;
    const isStale = field.updatedAt
      ? Date.now() - new Date(field.updatedAt).getTime() > 7 * 24 * 60 * 60 * 1000
      : false;

    const riskLevel = field.status === 'at_risk' || hasHarvestPressure || isStale ? 'high' : 'medium';
    const concerns = [
      ...(isStale ? ['No recent update captured for this field.'] : []),
      ...(hasHarvestPressure ? ['Harvest date is approaching, so follow-up should be prioritized.'] : []),
      ...(field.notes?.length ? [] : ['There are no notes yet, so visibility is limited.']),
    ];

    const recommendedActions = [
      'Inspect the field and confirm crop condition.',
      'Update the field stage and add notes after the next visit.',
      ...(field.expectedHarvestDate ? ['Review harvest timing and assign a follow-up date.'] : ['Capture an expected harvest date to improve planning.']),
    ];

    return {
      summary: `Fallback analysis for ${field.name}: the field is ${field.status} at stage ${field.currentStage}. ${focus ? `Focus: ${focus}` : 'Review crop condition, timing, and recent notes.'}`,
      riskLevel,
      concerns,
      recommendedActions,
      followUpQuestion: 'Would you like a weekly action plan for this field?',
    };
  }

  private normalizeRiskLevel(value: unknown): 'low' | 'medium' | 'high' {
    const risk = String(value || '').toLowerCase();
    if (risk === 'low' || risk === 'medium' || risk === 'high') {
      return risk;
    }

    return 'medium';
  }

  private normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((item) => String(item).trim()).filter(Boolean);
  }
}