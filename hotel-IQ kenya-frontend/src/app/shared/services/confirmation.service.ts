import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmationRequest {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private readonly requestSubject = new BehaviorSubject<ConfirmationRequest | null>(null);

  readonly request$ = this.requestSubject.asObservable();

  private resolver: ((result: boolean) => void) | null = null;

  confirm(request: ConfirmationRequest): Promise<boolean> {
    this.requestSubject.next(request);
    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  accept(): void {
    this.resolve(true);
  }

  reject(): void {
    this.resolve(false);
  }

  clear(): void {
    this.requestSubject.next(null);
  }

  private resolve(result: boolean): void {
    if (this.resolver) {
      this.resolver(result);
      this.resolver = null;
    }

    this.clear();
  }
}