# Multi-stage Docker build for production deployment
FROM node:22-alpine AS builder

WORKDIR /app

# Vite injects public configuration during the client build. Leave this empty
# for a same-origin deployment, or set it to https://api.your-domain.com/api.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy dependency manifests and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build client + server bundle
COPY . .
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled bundles and static assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Ensure uploads and data directories exist with proper permissions
RUN mkdir -p /app/public/uploads /app/data && chown -R node:node /app

# Switch to non-root user for security
USER node

# Healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Expose default HTTP port
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
