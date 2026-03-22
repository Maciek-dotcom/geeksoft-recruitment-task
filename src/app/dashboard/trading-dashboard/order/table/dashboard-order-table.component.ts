import { Component, computed, inject } from '@angular/core';
import {
  OrderGroup,
  OrderItem,
} from '../../../../core/models/table-data.models';
import { OrderTableStore } from './order-table.store';

@Component({
  selector: 'app-dashboard-order-table',
  imports: [],
  templateUrl: './dashboard-order-table.component.html',
  styleUrl: './dashboard-order-table.component.scss',
})
export class DashboardOrderTableComponent {
  protected readonly groups = inject(OrderTableStore).groups;
}
