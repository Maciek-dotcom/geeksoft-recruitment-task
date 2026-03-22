export interface WsQuoteRaw {
  s: string; // symbol
  b: number; // priceBid
  a: number; // askPrice
  t: number; // timestamp
}

export interface WsReceivedTopicMessage {
  p: string;
  d: WsQuoteRaw[];
}

export interface WsSendMessage {
  p: '/subscribe/addlist' | '/subscribe/removelist';
  d: string[];
}

export interface QuoteItem {
  symbol: string;
  bidPrice: number;
  askPrice: number;
  timestamp: number;
}
