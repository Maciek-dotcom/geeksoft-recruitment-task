import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
  withHooks,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, switchMap } from 'rxjs';
import {
  OrderGroup,
  OrderItemWithProfit,
} from '../core/models/order-group.model';
import { QuoteItem } from '../core/models/quote.model';
import {
  OrderItem,
  InstrumentItem,
  ContractTypeItem,
} from '../core/models/table-data.models';
import { GeekSoftApiService } from '../core/services/api.service';
import { WebSocketQuotesService } from '../core/services/websocket-quotes.service';
import { calculateProfit } from '../core/utils/profit-calculator';
import { round } from '../core/utils/round';
import { MatSnackBar } from '@angular/material/snack-bar';
interface OrderTableState {
  orders: OrderItem[];
  instruments: InstrumentItem[];
  contractTypes: ContractTypeItem[];
  currentPrices: Record<string, number>;
  loading: boolean;
  expandedSymbols: string[];
}

const initialState: OrderTableState = {
  orders: [],
  instruments: [],
  contractTypes: [],
  currentPrices: {},
  loading: true,
  expandedSymbols: [],
};

export const TradingDashboardOrdersTableStore = signalStore(
  withState(initialState),
  withComputed((state) => ({
    instrumentMap: computed(() => {
      const map = new Map<string, number>();
      for (const i of state.instruments()) {
        map.set(i.symbol, i.contractType);
      }
      return map;
    }),

    availableSymbols: computed(() => state.instruments().map((i) => i.symbol)),

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
          expanded: state.expandedSymbols().includes(symbol),
        };
      });
    }),
  })),

  withMethods(
    (
      store,
      api = inject(GeekSoftApiService),
      ws = inject(WebSocketQuotesService),
      snackbar = inject(MatSnackBar),
    ) => ({
      /**
       * Load static data (orders + instruments + contractTypes),
       * then subscribe to WebSocket quotes for all symbols.
       */
      loadAll: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() =>
            api.data$.pipe(
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
        let current = [...store.expandedSymbols()];
        if (current.includes(symbol)) {
          current = current.filter((s) => s !== symbol);
        } else {
          current = [...current, symbol];
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

        snackbar.open(`Zamknięto zlecenie nr: ${orderId}`, undefined, {
          verticalPosition: 'top',
          horizontalPosition: 'center',
          duration: 2000,
        });
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

        snackbar.open(`Zamknięto zlecenia: ${ids}`, undefined, {
          verticalPosition: 'top',
          horizontalPosition: 'center',
          duration: 2000,
        });
      },

      addOrder(order: OrderItem): void {
        const orders = store.orders();
        patchState(store, { orders: [...orders, order] });

        // If this is a new symbol — subscribe to WS quotes
        const symbolExists = orders.some((o) => o.symbol === order.symbol);
        if (!symbolExists) {
          ws.followSymbols([order.symbol]);
        }
      },

      /** Generate next unique order ID */
      nextOrderId(): number {
        const orders = store.orders();
        if (orders.length === 0) return 1;
        return Math.max(...orders.map((o) => o.id)) + 1;
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
