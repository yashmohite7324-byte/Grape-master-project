# 🍇 Grape Master

A full-stack agricultural marketplace connecting **farmers, brokers, fertilizer
sellers, and customers**, with ML-powered recommendations and PhonePe payments.

Built in verified, runnable phases — each phase compiles and runs on its own.

## Monorepo layout

```
grape-master/
├── backend/          # Node.js + Express + Prisma API   ← Phases 1–2 ✅
├── ml/               # Python + FastAPI recommender      (Phase 5)
├── frontend/         # Next.js 14 app                     (Phase 6)
└── docker-compose.yml
```

## Build roadmap

| Phase | Scope | Status |
| ----- | ----------------------------------------------------------- | ------ |
| 1 | Backend foundation + Auth (JWT/RBAC) + full DB schema        | ✅ done |
| 2 | Farmer listings + Broker marketplace + offers + inventory    | ✅ done |
| 3 | Fertilizer seller + orders + seller-mapping + cart           | next   |
| 4 | PhonePe payments + transactions + PDF receipts               | –      |
| 5 | Python/FastAPI ML recommendation service                     | –      |
| 6 | Next.js frontend (all role dashboards)                       | –      |
| 7 | Admin analytics + notifications + tests                      | –      |

## The produce flow (Phase 2)

```
Farmer lists produce (ACTIVE)
        │
        ▼
Broker browses marketplace ──▶ makes an offer (PENDING)
        │
        ▼
Farmer accepts  ── one atomic transaction ──▶
   • offer ACCEPTED
   • BrokerPurchase recorded
   • listing.availableQuantity reduced (SOLD at 0)
   • produce added to Broker Inventory (with a default selling price)
   • broker notified
```

## Get started

See [`backend/README.md`](./backend/README.md) for setup, demo accounts, and a
full curl walkthrough of the farmer→broker flow.

```bash
docker compose up -d
cd backend && npm install && cp .env.example .env
npm run prisma:migrate && npm run db:seed && npm run dev
```
