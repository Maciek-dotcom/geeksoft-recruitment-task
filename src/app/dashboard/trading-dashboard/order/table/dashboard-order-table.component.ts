import { Component } from '@angular/core';
import {
  OrderGroup,
  OrderItem,
} from '../../../../core/models/table-data.models';

@Component({
  selector: 'app-dashboard-order-table',
  imports: [],
  templateUrl: './dashboard-order-table.component.html',
  styleUrl: './dashboard-order-table.component.scss',
})
export class DashboardOrderTableComponent {
  groups: OrderGroup[] = [];
}
