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
import { calculateProfit } from '../../../../utils/profit-calculator';
import {
  OrderGroup,
  OrderItemWithProfit,
} from '../../../../core/models/order-group.model';

interface OrderTableState {
  orders: OrderItem[];
  instruments: InstrumentItem[];
  contractTypes: ContractTypeItem[];
  currentPrices: Record<string, number>;
  loading: boolean;
}

const initialState: OrderTableState = {
  orders: [],
  instruments: [],
  contractTypes: [],
  currentPrices: {},
  loading: false,
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

        // Calculate profit per order
        const ordersWithProfit: OrderItemWithProfit[] = symbolOrders.map(
          (order) => ({
            ...order,
            profit: calculateProfit(order, priceBid, contractSize),
          }),
        );

        const totalSize = symbolOrders.reduce((sum, o) => sum + o.size, 0);
        const totalSwap = ordersWithProfit.reduce((sum, o) => sum + o.swap, 0);
        const totalProfit = ordersWithProfit.reduce(
          (sum, o) => sum + o.profit,
          0,
        );

        // Weighted average open price
        const avgOpenPrice =
          totalSize > 0
            ? symbolOrders.reduce((sum, o) => sum + o.openPrice * o.size, 0) /
              totalSize
            : 0;

        return {
          symbol,
          orders: ordersWithProfit,
          totalSize,
          avgOpenPrice,
          totalSwap,
          totalProfit,
          contractSize,
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
