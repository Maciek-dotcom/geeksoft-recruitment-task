export type OrderSide = 'BUY' | 'SELL';

export interface OrderItem {
  openTime: number;
  openPrice: number;
  swap: number;
  id: number;
  symbol: string;
  side: OrderSide;
  size: number;
}

export interface OrderDataResponse {
  data: OrderItem[];
}

export interface InstrumentItem {
  symbol: string;
  contractType: number; // enum?
}

export interface ContractTypeItem {
  contractType: number; // enum?
  contractSize: number;
}
