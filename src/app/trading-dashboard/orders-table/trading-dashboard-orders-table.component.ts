import { DatePipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { SmartDecimalPipe } from '../../core/pipes/smart-decimal.pipe';
import { TradingDashboardOrdersTableStore } from '../trading-dashboard-order.store';

@Component({
  selector: 'app-trading-dashboard-orders-table',
  imports: [DatePipe, SmartDecimalPipe],
  templateUrl: './trading-dashboard-orders-table.component.html',
  styleUrl: './trading-dashboard-orders-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradingDashboardOrdersTableComponent {
  protected readonly store = inject(TradingDashboardOrdersTableStore);

  protected readonly groups = this.store.groups;

  onRemoveGroup(event: Event, symbol: string): void {
    event.stopPropagation(); // do not toggle expansion when clicking the remove button
    this.store.removeGroup(symbol);
  }

  onRemoveOrder(event: Event, orderId: number): void {
    event.stopPropagation();
    this.store.removeOrder(orderId);
  }
}
