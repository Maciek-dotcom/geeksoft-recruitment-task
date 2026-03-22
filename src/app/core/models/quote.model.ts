export interface QuoteItem {
  s: string; //symbol
  b: number; //priceBid
  a: number; //askPrice
  t: number; //timestamp
}

export interface WsMessage {
  p: string; //e.g. "/quotes/subscribed"
  d: QuoteItem[] | string[]; //data payload
}
