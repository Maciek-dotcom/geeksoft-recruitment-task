import { DatePipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { SmartDecimalPipe } from '../../core/pipes/smart-decimal.pipe';
import { TradingDashboardOrdersTableStore } from '../trading-dashboard-order.store';
import { NotificationService } from '../../core/services/notifications.service';

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

  protected readonly isLoading = this.store.loading;

  private readonly notificationsService = inject(NotificationService);

  onRemoveGroup(event: Event, symbol: string): void {
    event.stopPropagation(); // do not toggle expansion when clicking the remove button
    const result = this.store.removeGroup(symbol);

    if (result) this.notificationsService.closePosition(result.removedIds);
  }

  onRemoveOrder(event: Event, orderId: number): void {
    event.stopPropagation();
    const result = this.store.removeOrder(orderId);

    if (result) this.notificationsService.closePosition(result.removedIds);
  }
}
