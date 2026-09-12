# Grape Master — Frontend (Next.js 14)

Complete multi-role UI for the Grape Master agricultural marketplace.

## Roles and their pages

| Role               | Pages |
| ------------------ | ----- |
| **Farmer**         | Dashboard, Listings (list/create/detail+accept-reject), Offers inbox |
| **Broker**         | Dashboard, Marketplace (browse+filter), Listing detail (make offer), Offers, Inventory (edit price) |
| **Seller**         | Dashboard, Products (list/add/edit/toggle), Inventory (stock adjustment), Orders (list/detail/update status) |
| **Customer**       | Browse (search/filter), Product detail (add to cart), Cart + Checkout, Orders (list/detail+tracking), Receipt download |
| **Admin**          | Dashboard (stats + charts), Users (list/filter/toggle), Orders, Products, Transactions |
| **Shared**         | Landing page, Login, Register (4 roles), Profile edit |

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm run dev                  # http://localhost:3000
```

The backend must be running on port 3001. Start it first (`cd backend && npm run dev`).

## Demo accounts

Password for all: `Password123`

| Role     | Email                        |
| -------- | ---------------------------- |
| Farmer   | farmer@grapemaster.com       |
| Broker   | broker@grapemaster.com       |
| Seller   | seller@grapemaster.com       |
| Customer | customer@grapemaster.com     |
| Admin    | admin@grapemaster.com        |

## Design system

- **Display font:** Bricolage Grotesque (headings)
- **Body font:** Inter
- **Data/mono:** JetBrains Mono (prices, quantities, order numbers)
- **Palette:** Vineyard green (#1F6B4A), grape/aubergine (#6B3A5B), harvest amber (#B4741F)
- **Signature:** The "ledger" pattern — every price and quantity uses monospace tabular-nums with unit chips

## Architecture

```
src/
├── app/
│   ├── (landing)         page.tsx, layout.tsx
│   ├── login/            page.tsx
│   ├── register/         page.tsx
│   ├── profile/          page.tsx
│   ├── farmer/           layout.tsx, page.tsx, listings/*, offers/
│   ├── broker/           layout.tsx, page.tsx, marketplace/*, offers/, inventory/
│   ├── seller/           layout.tsx, page.tsx, products/*, inventory/, orders/*
│   ├── customer/         layout.tsx, page.tsx, browse/*, cart/, orders/*
│   └── admin/            layout.tsx, page.tsx, users/, orders/, products/, transactions/
├── components/
│   ├── DashboardShell.tsx  (sidebar + mobile nav + role guard)
│   ├── Toast.tsx           (toast system)
│   └── ui/index.tsx        (Button, Card, Field, Input, Pill, Spinner, Stat, etc.)
├── hooks/
│   └── useApi.ts           (fetch hook with loading/error/refetch)
└── lib/
    ├── api.ts              (typed fetch client with JWT)
    ├── auth-store.ts       (Zustand auth + session hydration)
    ├── cart-store.ts       (Zustand cart)
    ├── format.ts           (INR, qty, date, status styles)
    └── types.ts            (all TS interfaces mirroring DB schema)
```
