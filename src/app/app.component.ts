import { Component } from '@angular/core';
import { TradingDashboardComponent } from './trading-dashboard/trading-dashboard.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [TradingDashboardComponent],
})
export class AppComponent {}
