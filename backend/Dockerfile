# Backend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app/backend

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

# Build TypeScript
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# Production runtime
FROM node:20-alpine AS runner

WORKDIR /app/backend

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nodejs

COPY --from=builder --chown=nodejs:nodejs /app/backend/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/backend/package.json ./package.json

USER nodejs

EXPOSE 3000

CMD ["node", "dist/server.js"]
