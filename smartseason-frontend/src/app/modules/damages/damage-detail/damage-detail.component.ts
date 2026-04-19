import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DamagesService } from '../../../shared/services/damages/damages.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { Damage } from '../../../shared/interfaces/models';

@Component({
  selector: 'app-damage-detail',
  templateUrl: './damage-detail.component.html',
  styleUrls: ['./damage-detail.component.scss'],
})
export class DamageDetailComponent implements OnInit {
  damage: Damage | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private damagesService: DamagesService,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  load(id: string): void {
    this.damagesService.getById(id).subscribe({
      next: (d) => { this.damage = d; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  goBack(): void { this.router.navigate(['/damages']); }

  deleteDamage(): void {
    if (!this.damage || !confirm('Delete this damage report?')) return;
    this.damagesService.delete(this.damage._id).subscribe(() => this.goBack());
  }

  getStatusClasses(status: string): string {
    const map: Record<string, string> = {
      reported: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      assessed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      in_repair: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      repaired: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      deducted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      closed: 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400',
    };
    return map[status] || '';
  }

  getSeverityClasses(severity: string): string {
    const map: Record<string, string> = {
      low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return map[severity] || '';
  }
}
