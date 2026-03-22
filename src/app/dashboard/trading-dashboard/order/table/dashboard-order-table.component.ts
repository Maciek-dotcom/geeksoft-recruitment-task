import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { OrderTableStore } from './order-table.store';
import { DatePipe, DecimalPipe } from '@angular/common';
import { SmartDecimalPipe } from './pipes/smart-decimal.pipe';

@Component({
  selector: 'app-dashboard-order-table',
  imports: [DatePipe, SmartDecimalPipe],
  templateUrl: './dashboard-order-table.component.html',
  styleUrl: './dashboard-order-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardOrderTableComponent {
  protected readonly store = inject(OrderTableStore);

  protected readonly groups = this.store.groups;

  protected readonly isLoading = this.store.loading;
}
