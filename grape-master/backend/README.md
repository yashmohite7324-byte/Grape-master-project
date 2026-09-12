# 🍇 Grape Master — Complete Backend API

Node.js + Express + TypeScript + Prisma (PostgreSQL)

## Complete API Reference

### Auth  (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | – | Register (FARMER/BROKER/FERTILIZER_SELLER/CUSTOMER) |
| POST | `/login` | – | Get JWT token |
| GET  | `/me` | Bearer | Current user + profiles |
| PATCH| `/profile` | Bearer | Update shared profile |
| GET  | `/addresses` | Bearer | List addresses |
| POST | `/addresses` | Bearer | Add address |
| PATCH| `/addresses/:id` | Bearer | Edit address |
| DELETE | `/addresses/:id` | Bearer | Delete address |

### Farmer  (`/api/farmer`)  role: FARMER
| Method | Path | Description |
|--------|------|-------------|
| POST | `/listings` | Create produce listing |
| GET  | `/listings` | My listings (`?status=&page=&limit=`) |
| GET  | `/listings/:id` | One listing + all its offers |
| PUT  | `/listings/:id` | Edit listing |
| PATCH| `/listings/:id/cancel` | Cancel listing |
| GET  | `/offers` | All offers received |
| POST | `/offers/:id/accept` | ✅ Accept → creates purchase + inventory |
| POST | `/offers/:id/reject` | Reject an offer |

### Broker  (`/api/broker`)  role: BROKER
| Method | Path | Description |
|--------|------|-------------|
| GET  | `/marketplace` | Browse listings (`?cropType=&district=&maxPrice=&sort=`) |
| GET  | `/marketplace/:id` | Listing detail |
| POST | `/marketplace/:id/offer` | Make an offer |
| GET  | `/offers` | My offers (`?status=`) |
| PATCH| `/offers/:id/withdraw` | Withdraw pending offer |
| GET  | `/inventory` | Purchased produce stock |
| PATCH| `/inventory/:id/price` | Set customer selling price |

### Seller  (`/api/seller`)  role: FERTILIZER_SELLER
| Method | Path | Description |
|--------|------|-------------|
| POST | `/products` | Add fertilizer product |
| GET  | `/products` | My products |
| GET  | `/products/:id` | Product detail |
| PUT  | `/products/:id` | Edit product |
| PATCH| `/products/:id/toggle` | Activate / deactivate |
| PATCH| `/inventory/:id` | Adjust stock (`{ adjustment: ±N }`) |
| GET  | `/orders` | Orders received |
| GET  | `/orders/:id` | Order detail |
| PATCH| `/orders/:id/status` | Advance order status |

### Products  (`/api/products`)  public
| Method | Path | Description |
|--------|------|-------------|
| GET  | `/` | Browse fertilizers (`?search=&category=&minPrice=&maxPrice=`) |
| GET  | `/:id` | Product detail |

### Orders  (`/api/orders`)  auth required
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Place order (CUSTOMER only) |
| GET  | `/` | My orders as buyer |
| GET  | `/:id` | Order detail |
| PATCH| `/:id/cancel` | Cancel unpaid order |
| PATCH| `/:id/status` | Advance status (Seller) |
| GET  | `/:id/receipt` | Receipt for an order |

### Payments  (`/api/payments`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/initiate` | Start PhonePe payment for order |
| POST | `/simulate-success` | Demo: mark order as paid |
| POST | `/callback` | PhonePe server callback (no auth) |
| GET  | `/:orderId` | Payment + transaction + receipt status |

### Notifications  (`/api/notifications`)  auth required
| Method | Path | Description |
|--------|------|-------------|
| GET  | `/` | Paginated notifications (`?unread=true`) |
| PATCH| `/:id/read` | Mark one as read |
| PATCH| `/read-all` | Mark all as read |

### Recommendations  (`/api/recommendations`)
| Method | Path | Description |
|--------|------|-------------|
| GET  | `/` | Personalized product recommendations |
| POST | `/events` | Log user behaviour event |
| POST | `/feedback` | Log recommendation feedback |

### Admin  (`/api/admin`)  role: ADMIN
| Method | Path | Description |
|--------|------|-------------|
| GET  | `/stats` | Platform stats (users, orders, revenue) |
| GET  | `/users` | All users (`?role=&search=`) |
| PATCH| `/users/:id` | Activate / deactivate user |
| GET  | `/orders` | All orders (`?status=`) |
| GET  | `/products` | All products |
| PATCH| `/products/:id` | Toggle / update product |
| GET  | `/transactions` | All transactions |
| GET  | `/inventory` | Full inventory overview + low-stock alerts |

## Setup

```bash
npm install
cp .env.example .env        # set DATABASE_URL and JWT_SECRET

docker compose up -d         # start local Postgres (from repo root)
npm run prisma:migrate       # apply schema and generate Prisma client
npm run db:seed              # 5 demo users + 6 products + 1 listing

npm run dev                  # http://localhost:3001
```

## Demo accounts (password: Password123)
| Role | Email |
|------|-------|
| Admin | admin@grapemaster.com |
| Farmer | farmer@grapemaster.com |
| Broker | broker@grapemaster.com |
| Seller | seller@grapemaster.com |
| Customer | customer@grapemaster.com |

## Quick test

```bash
# Login as farmer
TOKEN=$(curl -s http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"farmer@grapemaster.com","password":"Password123"}' | jq -r .data.token)

# See platform stats (admin)
ADMIN=$(curl -s http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@grapemaster.com","password":"Password123"}' | jq -r .data.token)
curl http://localhost:3001/api/admin/stats -H "Authorization: Bearer $ADMIN" | jq .

# Browse fertilizers (public)
curl "http://localhost:3001/api/products?category=DAP" | jq '.data[].name'
```
