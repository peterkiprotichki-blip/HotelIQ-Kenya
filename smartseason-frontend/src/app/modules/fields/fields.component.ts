import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FieldsService, Field, FieldStage } from '../../shared/services/fields/fields.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { UsersService } from '../../shared/services/users/users.service';
import { BomoproUser } from '../../shared/interfaces/models';
import { FieldCreateModalComponent, CreateFieldFormValue } from './field-create-modal.component';
import { FieldsListComponent } from './fields-list.component';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { FieldNoteModalComponent, CreateFieldNoteValue } from './field-note-modal.component';
import { ConfirmationService } from '../../shared/services/confirmation.service';
import { NotificationService } from '../../shared/services/notification.service';
import { FieldViewModalComponent } from './field-view-modal.component';

@Component({
  selector: 'app-fields',
  standalone: true,
  imports: [CommonModule, FieldCreateModalComponent, FieldsListComponent, FieldNoteModalComponent, FieldViewModalComponent],
  templateUrl: './fields.component.html',
})
export class FieldsComponent implements OnInit {
  fields: Field[] = [];
  agents: BomoproUser[] = [];
  loading = true;
  loadingAgents = false;
  creatingField = false;
  creatingNote = false;
  savingField = false;
  error = '';
  showCreateModal = false;
  showNoteModal = false;
  showViewModal = false;
  selectedFieldForNote: Field | null = null;
  selectedFieldForEdit: Field | null = null;
  selectedFieldForView: Field | null = null;

  updateDraft: Record<string, { stage: FieldStage; note: string }> = {};

  readonly stages: FieldStage[] = ['planted', 'growing', 'ready', 'harvested'];

  constructor(
    private readonly fieldsService: FieldsService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly confirmationService: ConfirmationService,
    private readonly notificationService: NotificationService,
    public readonly themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.loadFields();
    if (this.isAdminLike) {
      this.loadAgents();
    }
  }

  get userRole(): string {
    return this.authService.getUser()?.role || '';
  }

  get isAdminLike(): boolean {
    return ['super_admin', 'admin', 'manager'].includes(this.userRole);
  }

  openCreateFieldModal(): void {
    this.selectedFieldForEdit = null;
    this.showCreateModal = true;
  }

  loadFields(): void {
    this.loading = true;
    this.error = '';
    this.fieldsService.getAll().subscribe({
      next: (res) => {
        this.fields = res;
        this.fields.forEach((field) => {
          if (!this.updateDraft[field._id]) {
            this.updateDraft[field._id] = {
              stage: field.currentStage,
              note: '',
            };
          }
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load fields';
        this.loading = false;
      },
    });
  }

  createField(payload: CreateFieldFormValue): void {
    this.savingField = true;
    this.error = '';
    const isEditMode = Boolean(this.selectedFieldForEdit);
    const request$ = this.selectedFieldForEdit
      ? this.fieldsService.update(this.selectedFieldForEdit._id, {
          name: payload.name.trim(),
          cropType: payload.cropType.trim(),
          plantingDate: payload.plantingDate,
          expectedHarvestDate: payload.expectedHarvestDate || undefined,
          assignedAgentId: payload.assignedAgentId,
          location: payload.location?.trim() || undefined,
          currentStage: this.selectedFieldForEdit.currentStage,
        })
      : this.fieldsService.create({
          name: payload.name.trim(),
          cropType: payload.cropType.trim(),
          plantingDate: payload.plantingDate,
          expectedHarvestDate: payload.expectedHarvestDate || undefined,
          assignedAgentId: payload.assignedAgentId,
          location: payload.location?.trim() || undefined,
        });

    request$.subscribe({
      next: () => {
        this.savingField = false;
        this.showCreateModal = false;
        this.selectedFieldForEdit = null;
        this.loadFields();
        this.notificationService.success(isEditMode ? 'Field updated successfully' : 'Field created successfully');
      },
      error: (err) => {
        this.savingField = false;
        this.error = err?.error?.message || (this.selectedFieldForEdit ? 'Failed to update field' : 'Failed to create field');
      },
    });
  }

  onStageChanged(event: { field: Field; stage: FieldStage }): void {
    this.error = '';
    this.fieldsService
      .addUpdate(event.field._id, {
        stage: event.stage,
        note: `Stage updated to ${event.stage}`,
      })
      .subscribe({
        next: () => {
          this.loadFields();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to update stage';
          this.updateDraft[event.field._id] = {
            stage: event.field.currentStage,
            note: this.updateDraft[event.field._id]?.note || '',
          };
        },
      });
  }

  onAddNote(field: Field): void {
    this.selectedFieldForNote = field;
    this.showNoteModal = true;
  }

  saveNote(payload: CreateFieldNoteValue): void {
    if (!this.selectedFieldForNote) {
      return;
    }

    this.creatingNote = true;
    this.error = '';
    this.fieldsService
      .addUpdate(this.selectedFieldForNote._id, {
        note: payload.note,
      })
      .subscribe({
        next: () => {
          this.creatingNote = false;
          this.showNoteModal = false;
          this.selectedFieldForNote = null;
          this.loadFields();
          this.notificationService.success('Note saved successfully');
        },
        error: (err) => {
          this.creatingNote = false;
          this.error = err?.error?.message || 'Failed to add note';
        },
      });
  }

  onEditField(field: Field): void {
    if (!this.isAdminLike) {
      return;
    }

    this.selectedFieldForEdit = field;
    this.showCreateModal = true;
  }

  onDeleteField(field: Field): void {
    if (!this.isAdminLike) {
      return;
    }

    this.confirmationService.confirm({
      title: 'Delete Field',
      message: `Delete field "${field.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    }).then((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.fieldsService.remove(field._id).subscribe({
        next: () => {
          this.loadFields();
          this.notificationService.success('Field deleted successfully');
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to delete field';
        },
      });
    });
  }

  onViewField(field: Field): void {
    this.selectedFieldForView = field;
    this.showViewModal = true;
  }

  onViewModalClosed(): void {
    this.showViewModal = false;
    this.selectedFieldForView = null;
  }

  onModalClosed(): void {
    this.showCreateModal = false;
    this.selectedFieldForEdit = null;
  }

  get fieldModalMode(): 'create' | 'edit' {
    return this.selectedFieldForEdit ? 'edit' : 'create';
  }

  get fieldModalInitialValue(): Partial<CreateFieldFormValue> | null {
    if (!this.selectedFieldForEdit) {
      return null;
    }

    return {
      name: this.selectedFieldForEdit.name,
      cropType: this.selectedFieldForEdit.cropType,
      plantingDate: this.selectedFieldForEdit.plantingDate,
      expectedHarvestDate: this.selectedFieldForEdit.expectedHarvestDate,
      assignedAgentId: this.selectedFieldForEdit.assignedAgentId,
      location: this.selectedFieldForEdit.location,
    };
  }

  loadAgents(): void {
    this.loadingAgents = true;
    this.usersService.getAll(1, 200).subscribe({
      next: (res) => {
        this.agents = (res.data || []).filter((user) => user.role === 'agent' && user.isActive);
        this.loadingAgents = false;
      },
      error: () => {
        this.loadingAgents = false;
      },
    });
  }

  getAgentName(agentId: string): string {
    const match = this.agents.find((agent) => agent._id === agentId);
    return match ? match.name : 'Unassigned';
  }
}
