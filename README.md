# GeekSoft Trading Dashboard

Real-time trading dashboard built with **Angular 21** and **NgRx Signal Store**. The application displays open orders grouped by symbol, calculates live profit based on WebSocket price quotes, and allows adding/removing orders.

## Features

- 📊 **Orders table** — orders grouped by symbol with expandable rows
- 💰 **Real-time profit** — live calculation based on WebSocket bid prices
- ➕ **New order form** — add orders with validation (symbol, side, size, price)
- ❌ **Close orders** — remove individual orders or entire symbol groups
- 🌗 **Dark / Light theme** — auto-detects system preference, toggleable at runtime
- ⚡ **Reactive architecture** — signal-based state management with `@ngrx/signals`

## Tech Stack

| Layer            | Technology                                      |
| ---------------- | ----------------------------------------------- |
| Framework        | Angular 21 (standalone components)              |
| State management | NgRx Signal Store                               |
| Real-time data   | RxJS `webSocket` with exponential backoff retry |
| Forms            | Angular Reactive Forms                          |
| Styling          | SCSS with CSS custom properties (theming)       |
| Language         | TypeScript 5.9                                  |

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/          # OrderItem, QuoteItem, OrderGroup, etc.
│   │   ├── pipes/           # SmartDecimalPipe
│   │   ├── services/        # GeekSoftApiService, WebSocketQuotesService, ThemeService
│   │   └── utils/           # calculateProfit(), round()
│   ├── trading-dashboard/
│   │   ├── form/            # New order form component
│   │   ├── orders-table/    # Grouped orders table component
│   │   ├── trading-dashboard.component.*
│   │   └── trading-dashboard-order.store.ts  # NgRx Signal Store
│   ├── app.component.*
│   ├── app.config.ts
│   └── app.routes.ts
├── styles.scss              # Global styles + theme variables
├── variables.scss           # SCSS design tokens
└── index.html
```

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10

### Installation

```bash
git clone https://github.com/Maciek-dotcom/GeekSoft-Job-Interview.git
cd GeekSoft-Job-Interview
npm install
```

### Development

```bash
ng serve
```

Open [http://localhost:4200](http://localhost:4200). The app hot-reloads on file changes.

### Production Build

```bash
ng build
```

Build artifacts are written to `dist/`.

## Data Sources

| Endpoint                    | Description                           |
| --------------------------- | ------------------------------------- |
| `GET /order-data.json`      | Initial open orders                   |
| `GET /instruments.json`     | Symbol → contract type mapping        |
| `GET /contract-types.json`  | Contract type → contract size mapping |
| `WSS webquotes.geeksoft.pl` | Live bid/ask price quotes             |

## Profit Calculation

```
profit = (bidPrice − openPrice) × size × contractSize × sideMultiplier
```

Where `sideMultiplier` is `+1` for BUY and `−1` for SELL.
