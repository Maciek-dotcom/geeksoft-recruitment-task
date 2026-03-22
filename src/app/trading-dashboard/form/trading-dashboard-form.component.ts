import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { OrderSide, OrderItem } from '../../core/models/table-data.models';
import { TradingDashboardOrdersTableStore } from '../trading-dashboard-order.store';

@Component({
  selector: 'app-trading-dashboard-form',
  imports: [ReactiveFormsModule],
  templateUrl: './trading-dashboard-form.component.html',
  styleUrl: './trading-dashboard-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradingDashboardFormComponent {
  private readonly store = inject(TradingDashboardOrdersTableStore);

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly availableSymbols = this.store.availableSymbols;

  protected readonly sides: OrderSide[] = ['BUY', 'SELL'];

  protected readonly form = this.fb.group({
    symbol: ['', Validators.required],
    side: ['BUY' as OrderSide, Validators.required],
    size: [0.01, [Validators.required, Validators.min(0.01)]],
    openPrice: [0.01, [Validators.required, Validators.min(0.01)]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { symbol, side, size, openPrice } = this.form.getRawValue();

    const order: OrderItem = {
      id: this.store.nextOrderId(),
      symbol,
      side,
      size,
      openPrice,
      openTime: Date.now(),
      swap: 0,
    };

    this.store.addOrder(order);

    this.form.reset();
  }
}
