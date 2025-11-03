# ChainBill - Multi-stage Docker build for production deployment
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --legacy-peer-deps --only=production && npm cache clean --force

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm ci --only=production && npm cache clean --force

# Backend builder stage
FROM base AS backend-builder
WORKDIR /app/backend

# Copy backend source
COPY backend/package*.json ./
COPY backend/tsconfig*.json ./
COPY backend/nest-cli.json ./
COPY backend/src ./src
COPY backend/Prisma ./Prisma

# Install all dependencies (including dev)
RUN npm ci --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate --schema=./Prisma/schema.prisma

# Build the application
RUN npm run build

# Frontend builder stage
FROM base AS frontend-builder
WORKDIR /app/frontend

# Copy frontend source
COPY frontend/package*.json ./
COPY frontend/tsconfig.json ./
COPY frontend/next.config.ts ./
COPY frontend/postcss.config.mjs ./
COPY frontend/tailwindcss.config.mjs ./
COPY frontend/app ./app
COPY frontend/components ./components
COPY frontend/lib ./lib
COPY frontend/public ./public

# Install all dependencies
RUN npm ci

# Build the frontend
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install production dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    dumb-init

# Copy backend production files
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/dist ./backend/dist
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/Prisma ./backend/Prisma
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/package.json ./backend/package.json

# Copy frontend production files
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./frontend/
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/public ./frontend/public

# Copy startup scripts
COPY docker/start.sh ./start.sh
RUN chmod +x ./start.sh

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose ports
EXPOSE 3000 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]