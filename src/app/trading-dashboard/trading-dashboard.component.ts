import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '../core/services/theme.service';
import { TradingDashboardFormComponent } from './form/trading-dashboard-form.component';
import { TradingDashboardOrdersTableComponent } from './orders-table/trading-dashboard-order-table.component';
import { TradingDashboardOrderTableStore } from './trading-dashboard-order.store';

@Component({
  selector: 'app-trading-dashboard',
  templateUrl: './trading-dashboard.component.html',
  styleUrl: './trading-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TradingDashboardOrdersTableComponent,
    TradingDashboardFormComponent,
  ],
  providers: [TradingDashboardOrderTableStore],
})
export class TradingDashboardComponent {
  protected readonly themeService = inject(ThemeService);
}
