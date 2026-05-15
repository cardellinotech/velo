FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
# Provide a placeholder DATABASE_URL so Next.js can compile route handlers at build time.
# The real value must be supplied at runtime via the environment.
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
# Generate Drizzle types if needed (no-op if already done)
RUN npx drizzle-kit generate --config drizzle.config.ts || true
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Copy drizzle migrations for runtime migration support
COPY --from=builder /app/drizzle ./drizzle
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
