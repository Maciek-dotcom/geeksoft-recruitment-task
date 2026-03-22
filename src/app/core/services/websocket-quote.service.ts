import { Injectable } from '@angular/core';
import {
  Observable,
  filter,
  map,
  retry,
  timer,
  shareReplay,
} from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { WsMessage, QuoteItem } from '../models/quote.model';
@Injectable({
  providedIn: 'root',
})
export class WebSocketQuoteService {
  private readonly GEEKSOFT_WS_URL =
    'wss://webquotes.geeksoft.pl/websocket/quotes';

  private socket$: WebSocketSubject<WsMessage> | null = null;

  readonly quotes$: Observable<QuoteItem[]> = this.connect().pipe(
    filter((msg) => msg.p === '/quotes/subscribed'),
    map((msg) => msg.d as QuoteItem[]),
    shareReplay(1),
  );

  private connect(): Observable<WsMessage> {
    if (!this.socket$) {
      this.socket$ = webSocket<WsMessage>({
        url: this.GEEKSOFT_WS_URL,
        openObserver: {
          next: () => console.log('[WS] Connected to quotes'),
        },
        closeObserver: {
          next: () => console.log('[WS] Disconnected from quotes'),
        },
      });
    }

    return this.socket$.pipe(
      retry({
        count: 5,
        delay: () => timer(5000),
      }),
    );
  }

  /**
   * Track only given symbols.
   */
  followSymbols(symbols: string[]): void {
    this.socket$?.next({
      p: '/subscribe/addlist',
      d: symbols,
    });
  }

  /**
   * Unsubscribe from quotes for given symbols.
   */
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
