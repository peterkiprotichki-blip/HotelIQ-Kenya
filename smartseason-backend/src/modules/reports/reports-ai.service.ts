import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { mapRecords } from '../../prisma/prisma-mappers';

type ReportInsight = {
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  concerns: string[];
  recommendedActions: string[];
  followUpQuestion?: string;
};

@Injectable()
export class ReportsAiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async generateReportInsights(focus?: string) {
    const model = 'gemini-2.0-flash';
    const fields = await this.prisma.field.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });

    const normalizedFields = mapRecords(fields).map((field: any) => ({
      ...field,
      status: this.computeStatus(field.currentStage, field.expectedHarvestDate, field.updatedAt || field.createdAt),
    }));
    const stats = this.buildStats(normalizedFields);
    const prompt = this.buildPrompt(stats, normalizedFields, focus);

    let insights: ReportInsight;
    let source: 'gemini' | 'fallback' = 'gemini';
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    try {
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }

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
              maxOutputTokens: 800,
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
    } catch {
      source = 'fallback';
      insights = this.buildFallbackInsights(stats, normalizedFields, focus);
    }

    return {
      stats,
      insights,
      source,
      model,
    };
  }

  private buildPrompt(stats: any, fields: any[], focus?: string) {
    const reportSnapshot = {
      stats,
      topRiskFields: fields
        .filter((field) => field.status === 'at_risk')
        .slice(0, 8)
        .map((field) => ({
          name: field.name,
          cropType: field.cropType,
          currentStage: field.currentStage,
          expectedHarvestDate: field.expectedHarvestDate,
          updatedAt: field.updatedAt,
        })),
      agentLoad: this.buildAgentLoad(fields),
      recentFields: fields.slice(0, 12).map((field) => ({
        name: field.name,
        cropType: field.cropType,
        currentStage: field.currentStage,
        status: field.status,
        location: field.location,
        notesCount: field.notes?.length || 0,
      })),
      focus: focus || 'Assess the current portfolio health, the highest priorities, and the next actions to improve outcomes.',
    };

    return [
      'You are SmartSeason AI, an agricultural operations analyst.',
      'Return strict JSON only with these keys:',
      '{"summary":"string","riskLevel":"low|medium|high","concerns":["string"],"recommendedActions":["string"],"followUpQuestion":"string optional"}',
      'Keep the summary concise, practical, and focused on the report rather than on individual records.',
      'Use the data below and do not include markdown, code fences, or extra keys.',
      JSON.stringify(reportSnapshot, null, 2),
    ].join('\n\n');
  }

  private parseInsights(text: string): ReportInsight {
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

  private buildFallbackInsights(stats: any, fields: any[], focus?: string): ReportInsight {
    const riskRatio = stats.totalFields ? stats.statusBreakdown.atRisk / stats.totalFields : 0;
    const riskLevel = riskRatio >= 0.35 ? 'high' : riskRatio >= 0.15 ? 'medium' : 'low';
    const followUpQuestion = this.extractFollowUpQuestion(focus);
    const topRisks = fields
      .filter((field) => field.status === 'at_risk')
      .slice(0, 3)
      .map((field) => field.name);

    return {
      summary: `SmartSeason AI analysis for this report shows ${stats.totalFields} fields, ${stats.statusBreakdown.atRisk} at risk, and ${stats.statusBreakdown.completed} completed. ${followUpQuestion ? `Focus: ${followUpQuestion}` : 'Prioritize the highest-risk fields and keep updates current.'}`,
      riskLevel,
      concerns: [
        ...(topRisks.length ? [`Top priority fields: ${topRisks.join(', ')}.`] : ['No fields are currently flagged as at risk.']),
        ...(stats.totalFields ? [`${stats.statusBreakdown.atRisk} of ${stats.totalFields} fields need attention.`] : ['No field records are available yet.']),
      ],
      recommendedActions: [
        'Review the at-risk fields first and update their latest condition.',
        'Balance the workload across agents based on the current field distribution.',
        'Keep the report updated so the dashboard reflects the latest field status.',
      ],
      followUpQuestion: 'Would you like a focused action plan for the highest-risk fields?',
    };
  }

  private buildAgentLoad(fields: any[]) {
    const load = new Map<string, number>();
    fields.forEach((field) => {
      const key = field.assignedAgentId || 'unassigned';
      load.set(key, (load.get(key) || 0) + 1);
    });

    return Array.from(load.entries())
      .map(([agentId, count]) => ({ agentId, count }))
      .sort((a, b) => b.count - a.count);
  }

  private buildStats(fields: any[]) {
    const statusBreakdown = { active: 0, atRisk: 0, completed: 0 };
    const stageBreakdown = { planted: 0, growing: 0, ready: 0, harvested: 0 };

    fields.forEach((field) => {
      if (field.status === 'active') statusBreakdown.active += 1;
      if (field.status === 'at_risk') statusBreakdown.atRisk += 1;
      if (field.status === 'completed') statusBreakdown.completed += 1;

      stageBreakdown[field.currentStage] += 1;
    });

    return {
      totalFields: fields.length,
      statusBreakdown,
      stageBreakdown,
      atRiskFields: fields
        .filter((field) => field.status === 'at_risk')
        .map((field) => ({
          _id: field._id,
          name: field.name,
          cropType: field.cropType,
          currentStage: field.currentStage,
          expectedHarvestDate: field.expectedHarvestDate,
        })),
    };
  }

  private extractFollowUpQuestion(focus?: string): string {
    if (!focus) {
      return '';
    }

    const marker = 'User follow-up question:';
    const markerIndex = focus.lastIndexOf(marker);
    if (markerIndex === -1) {
      return focus.trim().slice(0, 180);
    }

    return focus
      .slice(markerIndex + marker.length)
      .trim()
      .split('\n')[0]
      .slice(0, 180);
  }

  private computeStatus(stage: string, expectedHarvestDate?: string | null, lastUpdated?: string | null) {
    if (stage === 'harvested') {
      return 'completed';
    }

    const now = Date.now();
    const staleThresholdMs = 7 * 24 * 60 * 60 * 1000;

    if (lastUpdated) {
      const stale = now - new Date(lastUpdated).getTime() > staleThresholdMs;
      if (stale) {
        return 'at_risk';
      }
    }

    if (expectedHarvestDate) {
      const daysToHarvest = (new Date(expectedHarvestDate).getTime() - now) / (24 * 60 * 60 * 1000);
      if (daysToHarvest <= 7) {
        return 'at_risk';
      }
    }

    return 'active';
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