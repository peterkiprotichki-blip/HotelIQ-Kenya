import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private isDarkSubject = new BehaviorSubject<boolean>(false);
  isDark$ = this.isDarkSubject.asObservable();

  private accentSubject = new BehaviorSubject<string>('#10b981');
  accent$ = this.accentSubject.asObservable();

  get isDark(): boolean {
    return this.isDarkSubject.value;
  }
  get accent(): string {
    return this.accentSubject.value;
  }

  constructor() {
    const savedDark = localStorage.getItem('smartseason-theme-dark');
    const savedAccent = localStorage.getItem('smartseason-accent-color');

    if (savedDark !== null) {
      this.applyTheme(savedDark === 'true');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.applyTheme(prefersDark);
    }

    this.applyAccentColor(savedAccent || '#10b981');
  }

  toggleTheme(): void {
    this.applyTheme(!this.isDark);
  }

  setAccentColor(hex: string): void {
    this.applyAccentColor(hex);
  }

  private applyTheme(dark: boolean): void {
    this.isDarkSubject.next(dark);
    localStorage.setItem('smartseason-theme-dark', String(dark));
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private applyAccentColor(hex: string): void {
    this.accentSubject.next(hex);
    localStorage.setItem('smartseason-accent-color', hex);

    const shades = this.generatePalette(hex);
    const root = document.documentElement;
    Object.entries(shades).forEach(([shade, color]) => {
      root.style.setProperty(`--accent-${shade}`, color);
    });
  }

  private generatePalette(hex: string): Record<string, string> {
    const { h, s } = this.hexToHsl(hex);
    const sat = (factor: number) => Math.max(0, Math.min(100, Math.round(s * factor)));
    return {
      '50': this.hslToHex(h, sat(0.67), 97),
      '100': this.hslToHex(h, sat(0.73), 93),
      '200': this.hslToHex(h, sat(0.82), 87),
      '300': this.hslToHex(h, sat(0.9), 78),
      '400': this.hslToHex(h, sat(0.95), 68),
      '500': this.hslToHex(h, s, 60),
      '600': this.hslToHex(h, sat(0.91), 53),
      '700': this.hslToHex(h, sat(0.84), 45),
      '800': this.hslToHex(h, sat(0.78), 37),
      '900': this.hslToHex(h, sat(0.7), 28),
    };
  }

  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  private hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
}
