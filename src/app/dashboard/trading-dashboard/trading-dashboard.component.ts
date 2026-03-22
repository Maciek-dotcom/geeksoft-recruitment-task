import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OrderTableStore } from './order/table/order-table.store';
import { DashboardOrderTableComponent } from './order/table/dashboard-order-table.component';

@Component({
  selector: 'app-trading-dashboard',
  templateUrl: './trading-dashboard.component.html',
  styleUrl: './trading-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DashboardOrderTableComponent],
  providers: [OrderTableStore],
})
export class TradingDashboardComponent {}
