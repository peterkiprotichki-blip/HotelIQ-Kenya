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
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
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
      throw new InternalServerErrorException(`Gemini request failed: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new InternalServerErrorException('Gemini returned an empty response');
    }

    const insights = this.parseInsights(text);
    return {
      field: mapRecord(field),
      insights,
      model: 'gemini-1.5-flash',
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