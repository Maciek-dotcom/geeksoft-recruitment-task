import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OrderTableStore } from './order/table/order-table.store';

@Component({
  selector: 'app-trading-dashboard',
  imports: [],
  providers: [OrderTableStore],
  templateUrl: './trading-dashboard.component.html',
  styleUrl: './trading-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradingDashboardComponent {}
