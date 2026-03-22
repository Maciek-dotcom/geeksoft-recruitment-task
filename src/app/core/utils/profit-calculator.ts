import { OrderItem } from '../models/table-data.models';

export function calculateProfit(
  order: OrderItem,
  priceBid: number,
  contractSize: number,
): number {
  if (priceBid === 0 || contractSize === 0) {
    return 0;
  }
  const sideMultiplier = order.side === 'BUY' ? 1 : -1;
  return (
    (priceBid - order.openPrice) * order.size * contractSize * sideMultiplier
  );
}
