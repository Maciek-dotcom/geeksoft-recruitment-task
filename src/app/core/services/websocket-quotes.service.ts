import { Injectable } from '@angular/core';
import {
  Observable,
  Subject,
  filter,
  map,
  shareReplay,
  retry,
  timer,
  takeUntil,
} from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import {
  QuoteItem,
  WsQuoteRaw,
  WsReceivedTopicMessage,
  WsSendMessage,
} from '../models/quote.model';

@Injectable({
  providedIn: 'root',
})
export class WebSocketQuotesService {
  private readonly GEEKSOFT_WS_URL =
    'wss://webquotes.geeksoft.pl/websocket/quotes';

  private socket$: WebSocketSubject<
    WsReceivedTopicMessage | WsSendMessage
  > | null = null;

  /**
   * Stream of domain-mapped quote updates
   */
  readonly quotes$: Observable<QuoteItem[]> = this.connect().pipe(
    filter(
      (msg): msg is WsReceivedTopicMessage => msg.p === '/quotes/subscribed',
    ),
    map((msg) =>
      msg.d.map(
        (raw): QuoteItem => ({
          symbol: raw.s,
          bidPrice: raw.b,
          askPrice: raw.a,
          timestamp: raw.t,
        }),
      ),
    ),
    shareReplay(1),
  );

  private connect(): Observable<WsReceivedTopicMessage> {
    if (!this.socket$) {
      this.socket$ = webSocket({
        url: this.GEEKSOFT_WS_URL,
        openObserver: {
          next: () => console.log('[WS] Connected to quotes'),
        },
        closeObserver: {
          next: () => console.log('[WS] Disconnected from quotes'),
        },
      });
    }

    return (this.socket$ as Observable<WsReceivedTopicMessage>).pipe(
      retry({
        count: 5,
        delay: (_, retryCount) =>
          timer(Math.min(1000 * 2 ** retryCount, 30000)),
      }),
    );
  }

  followSymbols(symbols: string[]): void {
    this.socket$?.next({
      p: '/subscribe/addlist',
      d: symbols,
    });
  }

  unfollow(symbols: string[]): void {
    this.socket$?.next({
      p: '/subscribe/removelist',
      d: symbols,
    });
  }

  disconnect(): void {
    this.socket$?.complete();
    this.socket$ = null;
  }
}
