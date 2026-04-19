import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Field, FieldStage, FieldStatus } from './schemas/field.schema';
import { AddFieldUpdateDto, CreateFieldDto, UpdateFieldDto } from './dto/field.dto';

@Injectable()
export class FieldsService {
  constructor(@InjectModel(Field.name) private readonly fieldModel: Model<Field>) {}

  async create(dto: CreateFieldDto, userId: string): Promise<Field> {
    const now = new Date();
    const field = new this.fieldModel({
      ...dto,
      plantingDate: new Date(dto.plantingDate),
      expectedHarvestDate: dto.expectedHarvestDate ? new Date(dto.expectedHarvestDate) : null,
      currentStage: dto.currentStage || FieldStage.PLANTED,
      notes: [],
      updatedBy: userId,
      updatedAt: now,
    });

    field.status = this.computeStatus(field.currentStage, field.expectedHarvestDate, now);
    await field.save();
    return field;
  }

  async findAll(user: { role: string; sub: string }): Promise<Field[]> {
    const filter: any = { isDeleted: { $ne: true } };
    if (user.role === 'agent') {
      filter.assignedAgentId = user.sub;
    }

    const fields = await this.fieldModel.find(filter).sort({ createdAt: -1 });
    return fields.map((field) => this.refreshStatus(field));
  }

  async findById(id: string, user: { role: string; sub: string }): Promise<Field> {
    const field = await this.fieldModel.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!field) {
      throw new NotFoundException('Field not found');
    }

    if (user.role === 'agent' && field.assignedAgentId !== user.sub) {
      throw new NotFoundException('Field not found');
    }

    return this.refreshStatus(field);
  }

  async update(id: string, dto: UpdateFieldDto, userId: string): Promise<Field> {
    const field = await this.fieldModel.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!field) {
      throw new NotFoundException('Field not found');
    }

    if (dto.name !== undefined) field.name = dto.name;
    if (dto.cropType !== undefined) field.cropType = dto.cropType;
    if (dto.plantingDate !== undefined) field.plantingDate = new Date(dto.plantingDate);
    if (dto.currentStage !== undefined) field.currentStage = dto.currentStage;
    if (dto.expectedHarvestDate !== undefined) field.expectedHarvestDate = dto.expectedHarvestDate ? new Date(dto.expectedHarvestDate) : null;
    if (dto.assignedAgentId !== undefined) field.assignedAgentId = dto.assignedAgentId;
    if (dto.location !== undefined) field.location = dto.location;

    field.updatedBy = userId;
    field.updatedAt = new Date();
    field.status = this.computeStatus(field.currentStage, field.expectedHarvestDate, field.updatedAt);

    await field.save();
    return field;
  }

  async addUpdate(id: string, dto: AddFieldUpdateDto, user: { role: string; sub: string; name?: string }): Promise<Field> {
    const field = await this.fieldModel.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!field) {
      throw new NotFoundException('Field not found');
    }

    if (user.role === 'agent' && field.assignedAgentId !== user.sub) {
      throw new NotFoundException('Field not found');
    }

    if (dto.stage) {
      field.currentStage = dto.stage;
    }

    const actor = user.name || user.sub;
    const timestamp = new Date().toISOString().slice(0, 10);
    field.notes = field.notes || [];
    field.notes.unshift(`${timestamp} - ${actor}: ${dto.note}`);
    field.notes = field.notes.slice(0, 50);

    field.updatedBy = user.sub;
    field.updatedAt = new Date();
    field.status = this.computeStatus(field.currentStage, field.expectedHarvestDate, field.updatedAt);

    await field.save();
    return field;
  }

  async remove(id: string): Promise<{ message: string }> {
    const field = await this.fieldModel.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!field) {
      throw new NotFoundException('Field not found');
    }

    field.isDeleted = true;
    await field.save();
    return { message: 'Field deleted successfully' };
  }

  async getStats(user: { role: string; sub: string }) {
    const fields = await this.findAll(user);
    const statusBreakdown = {
      active: 0,
      atRisk: 0,
      completed: 0,
    };

    const stageBreakdown = {
      planted: 0,
      growing: 0,
      ready: 0,
      harvested: 0,
    };

    for (const field of fields) {
      if (field.status === FieldStatus.ACTIVE) statusBreakdown.active += 1;
      if (field.status === FieldStatus.AT_RISK) statusBreakdown.atRisk += 1;
      if (field.status === FieldStatus.COMPLETED) statusBreakdown.completed += 1;

      stageBreakdown[field.currentStage] += 1;
    }

    return {
      totalFields: fields.length,
      statusBreakdown,
      stageBreakdown,
      atRiskFields: fields.filter((f) => f.status === FieldStatus.AT_RISK).map((f) => ({
        _id: f._id,
        name: f.name,
        cropType: f.cropType,
        currentStage: f.currentStage,
        expectedHarvestDate: f.expectedHarvestDate,
      })),
    };
  }

  private refreshStatus(field: Field): Field {
    const computed = this.computeStatus(field.currentStage, field.expectedHarvestDate, field.updatedAt || field.createdAt);
    if (computed !== field.status) {
      field.status = computed;
      field.save();
    }
    return field;
  }

  private computeStatus(stage: FieldStage, expectedHarvestDate?: Date | null, lastUpdated?: Date | null): FieldStatus {
    if (stage === FieldStage.HARVESTED) {
      return FieldStatus.COMPLETED;
    }

    const now = Date.now();
    const staleThresholdMs = 7 * 24 * 60 * 60 * 1000;

    if (lastUpdated) {
      const stale = now - new Date(lastUpdated).getTime() > staleThresholdMs;
      if (stale) {
        return FieldStatus.AT_RISK;
      }
    }

    if (expectedHarvestDate) {
      const daysToHarvest = (new Date(expectedHarvestDate).getTime() - now) / (24 * 60 * 60 * 1000);
      if (daysToHarvest <= 7) {
        return FieldStatus.AT_RISK;
      }
    }

    return FieldStatus.ACTIVE;
  }
}
