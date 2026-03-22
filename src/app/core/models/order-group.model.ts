import { OrderItem } from './table-data.models';

// --- Exported group interface (for template typing) ---
export interface OrderGroup {
  symbol: string;
  orders: OrderItemWithProfit[];
  totalSize: number;
  avgOpenPrice: number;
  totalSwap: number;
  totalProfit: number;
  contractSize: number;
  expanded: boolean;
}

export interface OrderItemWithProfit extends OrderItem {
  profit: number;
}
