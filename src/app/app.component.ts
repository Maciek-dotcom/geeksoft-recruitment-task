import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TradingDashboardComponent } from './dashboard/trading-dashboard/trading-dashboard.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [TradingDashboardComponent],
})
export class AppComponent {}
