import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { OrderTableStore } from './order/table/order-table.store';
import { DashboardOrderTableComponent } from './order/table/dashboard-order-table.component';
import { ThemeService } from '../../core/services/theme.service';
import { DashboardTradingFormComponent } from './form/dashboard-trading-form.component';

@Component({
  selector: 'app-trading-dashboard',
  templateUrl: './trading-dashboard.component.html',
  styleUrl: './trading-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DashboardOrderTableComponent, DashboardTradingFormComponent],
  providers: [OrderTableStore],
})
export class TradingDashboardComponent {
  protected readonly themeService = inject(ThemeService);
}
