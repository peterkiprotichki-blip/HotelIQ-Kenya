import { Component } from '@angular/core';
import { ThemeService } from './shared/services/theme/theme.service';

@Component({
  selector: 'app-root',
  template: '<app-notification-toast></app-notification-toast><app-confirmation-dialog></app-confirmation-dialog><router-outlet></router-outlet>',
  styles: [':host { display: block; height: 100vh; }'],
})
export class AppComponent {
  title = 'Bomapro';

  constructor(private themeService: ThemeService) {}
}
