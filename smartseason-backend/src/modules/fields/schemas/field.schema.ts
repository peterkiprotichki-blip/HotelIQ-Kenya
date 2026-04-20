import { FieldStage, FieldStatus } from '@prisma/client';

export { FieldStage, FieldStatus };

export interface Field {
  id: string;
  name: string;
  cropType: string;
  plantingDate: Date;
  currentStage: FieldStage;
  status: FieldStatus;
  assignedAgentId: string;
  description: string;
  areaSize: number;
  location: string;
  notes: string[];
  expectedHarvestDate: Date | null;
  updatedBy?: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
