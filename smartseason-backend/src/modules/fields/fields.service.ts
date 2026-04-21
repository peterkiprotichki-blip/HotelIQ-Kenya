import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { mapRecord, mapRecords } from '../../prisma/prisma-mappers';
import { AddFieldUpdateDto, CreateFieldDto, UpdateFieldDto } from './dto/field.dto';
import { FieldStage, FieldStatus } from './schemas/field.schema';

@Injectable()
export class FieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFieldDto, userId: string) {
    const currentStage = dto.currentStage || FieldStage.planted;
    const expectedHarvestDate = dto.expectedHarvestDate ? new Date(dto.expectedHarvestDate) : null;
    const field = await this.prisma.field.create({
      data: {
        name: dto.name,
        cropType: dto.cropType,
        plantingDate: new Date(dto.plantingDate),
        expectedHarvestDate,
        currentStage,
        assignedAgentId: dto.assignedAgentId,
        location: dto.location || '',
        notes: [],
        updatedBy: userId,
        status: this.computeStatus(currentStage, expectedHarvestDate, new Date()),
      },
    });

    return mapRecord(field);
  }

  async findAll(user: { role: string; sub: string }) {
    const where: any = { isDeleted: false };
    if (user.role === 'agent') {
      where.assignedAgentId = user.sub;
    }

    const fields = await this.prisma.field.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const refreshed = [] as any[];
    for (const field of fields) {
      refreshed.push(await this.refreshStatus(field));
    }

    return mapRecords(refreshed);
  }

  async findById(id: string, user: { role: string; sub: string }) {
    const field = await this.prisma.field.findUnique({ where: { id } });
    if (!field || field.isDeleted) {
      throw new NotFoundException('Field not found');
    }

    if (user.role === 'agent' && field.assignedAgentId !== user.sub) {
      throw new NotFoundException('Field not found');
    }

    return mapRecord(await this.refreshStatus(field));
  }

  async update(id: string, dto: UpdateFieldDto, userId: string) {
    const field = await this.prisma.field.findUnique({ where: { id } });
    if (!field || field.isDeleted) {
      throw new NotFoundException('Field not found');
    }

    const currentStage = dto.currentStage ?? field.currentStage;
    const expectedHarvestDate = dto.expectedHarvestDate !== undefined
      ? (dto.expectedHarvestDate ? new Date(dto.expectedHarvestDate) : null)
      : field.expectedHarvestDate;

    const updated = await this.prisma.field.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.cropType !== undefined ? { cropType: dto.cropType } : {}),
        ...(dto.plantingDate !== undefined ? { plantingDate: new Date(dto.plantingDate) } : {}),
        ...(dto.currentStage !== undefined ? { currentStage: dto.currentStage } : {}),
        ...(dto.expectedHarvestDate !== undefined ? { expectedHarvestDate } : {}),
        ...(dto.assignedAgentId !== undefined ? { assignedAgentId: dto.assignedAgentId } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        updatedBy: userId,
        status: this.computeStatus(currentStage, expectedHarvestDate, new Date()),
      },
    });

    return mapRecord(updated);
  }

  async addUpdate(id: string, dto: AddFieldUpdateDto, user: { role: string; sub: string; name?: string }) {
    const field = await this.prisma.field.findUnique({ where: { id } });
    if (!field || field.isDeleted) {
      throw new NotFoundException('Field not found');
    }

    if (user.role === 'agent' && field.assignedAgentId !== user.sub) {
      throw new NotFoundException('Field not found');
    }

    const currentStage = dto.stage || field.currentStage;
    const timestamp = new Date().toISOString().slice(0, 10);
    const notes = [
      `${timestamp} - ${user.name || user.sub}: ${dto.note}`,
      ...(field.notes || []),
    ].slice(0, 50);

    const updated = await this.prisma.field.update({
      where: { id },
      data: {
        ...(dto.stage ? { currentStage: dto.stage } : {}),
        notes,
        updatedBy: user.sub,
        status: this.computeStatus(currentStage, field.expectedHarvestDate, new Date()),
      },
    });

    return mapRecord(updated);
  }

  async updateNote(id: string, noteIndex: number, note: string, user: { role: string; sub: string }) {
    const field = await this.prisma.field.findUnique({ where: { id } });
    if (!field || field.isDeleted) {
      throw new NotFoundException('Field not found');
    }

    if (user.role === 'agent' && field.assignedAgentId !== user.sub) {
      throw new NotFoundException('Field not found');
    }

    const currentNotes = [...(field.notes || [])];
    if (noteIndex < 0 || noteIndex >= currentNotes.length) {
      throw new NotFoundException('Note not found');
    }

    const existing = currentNotes[noteIndex] || '';
    const delimiterIndex = existing.indexOf(': ');
    if (delimiterIndex === -1) {
      currentNotes[noteIndex] = note.trim();
    } else {
      const prefix = existing.slice(0, delimiterIndex);
      currentNotes[noteIndex] = `${prefix}: ${note.trim()}`;
    }

    const updated = await this.prisma.field.update({
      where: { id },
      data: {
        notes: currentNotes,
        updatedBy: user.sub,
        status: this.computeStatus(field.currentStage, field.expectedHarvestDate, new Date()),
      },
    });

    return mapRecord(updated);
  }

  async remove(id: string) {
    const field = await this.prisma.field.findUnique({ where: { id } });
    if (!field || field.isDeleted) {
      throw new NotFoundException('Field not found');
    }

    await this.prisma.field.update({
      where: { id },
      data: { isDeleted: true },
    });

    return { message: 'Field deleted successfully' };
  }

  async getStats(user: { role: string; sub: string }) {
    const fields = await this.findAll(user);
    const statusBreakdown = { active: 0, atRisk: 0, completed: 0 };
    const stageBreakdown = { planted: 0, growing: 0, ready: 0, harvested: 0 };

    for (const field of fields as any[]) {
      if (field.status === FieldStatus.active) statusBreakdown.active += 1;
      if (field.status === FieldStatus.at_risk) statusBreakdown.atRisk += 1;
      if (field.status === FieldStatus.completed) statusBreakdown.completed += 1;

      stageBreakdown[field.currentStage] += 1;
    }

    return {
      totalFields: fields.length,
      statusBreakdown,
      stageBreakdown,
      atRiskFields: (fields as any[])
        .filter((f) => f.status === FieldStatus.at_risk)
        .map((f) => ({
          _id: f._id,
          name: f.name,
          cropType: f.cropType,
          currentStage: f.currentStage,
          expectedHarvestDate: f.expectedHarvestDate,
        })),
    };
  }

  private async refreshStatus(field: any) {
    const computed = this.computeStatus(field.currentStage, field.expectedHarvestDate, field.updatedAt || field.createdAt);
    if (computed !== field.status) {
      field = await this.prisma.field.update({
        where: { id: field.id },
        data: { status: computed },
      });
    }

    return field;
  }

  private computeStatus(stage: FieldStage, expectedHarvestDate?: Date | null, lastUpdated?: Date | null) {
    if (stage === FieldStage.harvested) {
      return FieldStatus.completed;
    }

    const now = Date.now();
    const staleThresholdMs = 7 * 24 * 60 * 60 * 1000;

    if (lastUpdated) {
      const stale = now - new Date(lastUpdated).getTime() > staleThresholdMs;
      if (stale) {
        return FieldStatus.at_risk;
      }
    }

    if (expectedHarvestDate) {
      const daysToHarvest = (new Date(expectedHarvestDate).getTime() - now) / (24 * 60 * 60 * 1000);
      if (daysToHarvest <= 7) {
        return FieldStatus.at_risk;
      }
    }

    return FieldStatus.active;
  }
}
