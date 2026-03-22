import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-trading-dashboard',
  imports: [],
  templateUrl: './trading-dashboard.component.html',
  styleUrl: './trading-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradingDashboardComponent {}
