import { computed, inject } from '@angular/core';
import { pipe, tap, switchMap, forkJoin } from 'rxjs';
import { GeekSoftApiService } from '../../../../core/api.service';
import {
  OrderItem,
  InstrumentItem,
  ContractTypeItem,
} from '../../../../core/models/table-data.models';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { QuoteItem } from '../../../../core/models/quote.model';
import { WebSocketQuotesService } from '../../../../core/services/websocket-quotes.service';
import {
  OrderGroup,
  OrderItemWithProfit,
} from '../../../../core/models/order-group.model';
import { calculateProfit } from '../../../../core/utils/profit-calculator';
import { round } from '../../../../core/utils/round';

interface OrderTableState {
  orders: OrderItem[];
  instruments: InstrumentItem[];
  contractTypes: ContractTypeItem[];
  currentPrices: Record<string, number>;
  loading: boolean;
  expandedSymbols: Set<string>;
}

const initialState: OrderTableState = {
  orders: [],
  instruments: [],
  contractTypes: [],
  currentPrices: {},
  loading: false,
  expandedSymbols: new Set<string>(),
};

export const OrderTableStore = signalStore(
  withState(initialState),
  withComputed((state) => ({
    instrumentMap: computed(() => {
      const map = new Map<string, number>();
      for (const i of state.instruments()) {
        map.set(i.symbol, i.contractType);
      }
      return map;
    }),

    contractSizeMap: computed(() => {
      const map = new Map<number, number>();
      for (const c of state.contractTypes()) {
        map.set(c.contractType, c.contractSize);
      }
      return map;
    }),
  })),

  withComputed((state) => ({
    groups: computed((): OrderGroup[] => {
      const orders = state.orders();
      const prices = state.currentPrices();
      const instrumentMap = state.instrumentMap();
      const contractSizeMap = state.contractSizeMap();

      // Debugging purposes
      // TODO: remove that
      console.log(prices);

      // Group by symbol
      const grouped = new Map<string, OrderItem[]>();
      for (const order of orders) {
        const list = grouped.get(order.symbol) ?? [];
        list.push(order);
        grouped.set(order.symbol, list);
      }

      return [...grouped.entries()].map(([symbol, symbolOrders]) => {
        const contractType = instrumentMap.get(symbol);

        const contractSize =
          // contractType equal 0 is valid value. Make sure that won't be omited
          contractType !== undefined
            ? (contractSizeMap.get(contractType) ?? 0)
            : 0;

        const priceBid = prices[symbol] ?? 0;

        const ordersWithProfit: OrderItemWithProfit[] = symbolOrders.map(
          (order) => ({
            ...order,
            profit: calculateProfit(order, priceBid, contractSize),
          }),
        );

        const totalProfit = ordersWithProfit.reduce(
          (sum, o) => sum + o.profit,
          0,
        );
        // JS is not a best language for financial calculations - round values to avoid floating point issues in template
        // Do not round profit values there
        // Use pipe to properly round total values

        const totalSize = round(
          symbolOrders.reduce((sum, o) => sum + o.size, 0),
          2,
        );
        const totalSwap = round(
          ordersWithProfit.reduce((sum, o) => sum + o.swap, 0),
          4,
        );

        const avgOpenPrice = round(
          totalSize > 0
            ? symbolOrders.reduce((sum, o) => sum + o.openPrice * o.size, 0) /
                totalSize
            : 0,
          4,
        );

        return {
          symbol,
          orders: ordersWithProfit,
          totalSize,
          avgOpenPrice,
          totalSwap,
          totalProfit,
          contractSize,
          expanded: state.expandedSymbols().has(symbol),
        };
      });
    }),
  })),

  withMethods(
    (
      store,
      api = inject(GeekSoftApiService),
      ws = inject(WebSocketQuotesService),
    ) => ({
      /**
       * Load static data (orders + instruments + contractTypes),
       * then subscribe to WebSocket quotes for all symbols.
       */
      loadAll: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() =>
            forkJoin({
              orders: api.getOrders(),
              instruments: api.getInstruments(),
              contractTypes: api.getContractTypes(),
            }).pipe(
              tap(({ orders, instruments, contractTypes }) => {
                patchState(store, {
                  orders,
                  instruments,
                  contractTypes,
                  loading: false,
                });

                // Extract unique symbols and subscribe to live quotes
                const symbols = [...new Set(orders.map((o) => o.symbol))];
                ws.followSymbols(symbols);
              }),
            ),
          ),
        ),
      ),

      /**
       * Connect to WebSocket quote stream.
       * Each emission updates currentPrices → triggers groups recompute → profit updates.
       */
      connectQuotes: rxMethod<QuoteItem[]>(
        pipe(
          tap((quotes) => {
            const prices = { ...store.currentPrices() };
            for (const q of quotes) {
              prices[q.symbol] = q.bidPrice;
            }
            patchState(store, { currentPrices: prices });
          }),
        ),
      ),

      toggleGroup(symbol: string): void {
        const current = new Set(store.expandedSymbols());
        if (current.has(symbol)) {
          current.delete(symbol);
        } else {
          current.add(symbol);
        }
        patchState(store, { expandedSymbols: current });
      },

      removeOrder(orderId: number): void {
        const orders = store.orders();
        const removed = orders.find((o) => o.id === orderId);
        if (!removed) return;

        const remaining = orders.filter((o) => o.id !== orderId);
        patchState(store, { orders: remaining });

        // If no more orders for that symbol → unsubscribe from WS
        const symbolStillUsed = remaining.some(
          (o) => o.symbol === removed.symbol,
        );
        if (!symbolStillUsed) {
          ws.unfollow([removed.symbol]);
        }

        alert(`Zamknięto zlecenie nr ${orderId}`);
      },

      removeGroup(symbol: string): void {
        const orders = store.orders();
        const groupOrders = orders.filter((o) => o.symbol === symbol);
        if (groupOrders.length === 0) return;

        const ids = groupOrders.map((o) => o.id).join(', ');

        patchState(store, {
          orders: orders.filter((o) => o.symbol !== symbol),
        });

        // Unsubscribe from WS — this symbol is gone
        ws.unfollow([symbol]);

        alert(`Zamknięto zlecenie nr ${ids}`);
      },
    }),
  ),

  withHooks({
    // Load all needed data and track quotes via webscoket
    onInit(store, ws = inject(WebSocketQuotesService)) {
      store.loadAll();
      store.connectQuotes(ws.quotes$);
    },
    onDestroy(_, ws = inject(WebSocketQuotesService)) {
      ws.disconnect();
    },
  }),
);
