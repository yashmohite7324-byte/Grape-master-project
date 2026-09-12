FROM node:20-bookworm-slim

WORKDIR /app

# Prisma's query/schema engines need OpenSSL at runtime on slim Debian images.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3001

# This project ships its Prisma schema but no migration history. `db push` is
# idempotent and ensures a fresh Docker volume is usable immediately; the seed
# uses upserts so restarts do not create duplicate demo data.
CMD ["sh", "-c", "npx prisma db push && npm run db:seed && npm run start"]
