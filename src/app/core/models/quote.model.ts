export interface WireQuoteItem {
  s: string; // symbol
  b: number; // priceBid
  a: number; // askPrice
  t: number; // timestamp
}

// Domain model used within the application
export interface QuoteItem {
  symbol: string;
  bidPrice: number;
  askPrice: number;
  timestamp: number;
}

export interface WsMessage {
  p: string; // e.g. "/quotes/subscribed"
  d: WireQuoteItem[] | string[]; // data payload
}
