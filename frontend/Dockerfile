# ─────────────────────────────────────────
# Stage 1 — BUILD
# Install dependencies and build Next.js app
# ─────────────────────────────────────────
FROM node:20-alpine AS builder
 
# Set working directory inside container
WORKDIR /app
 
# Copy package files first
# (Docker caching trick — if package.json unchanged,
#  npm ci layer is cached → faster rebuilds!)
COPY package.json package-lock.json ./
 
# Install all dependencies
RUN npm ci
 
# Copy all frontend source code
COPY . .
 
# Set backend API URL for the build
# This tells frontend where to fetch stock data from
ENV NEXT_PUBLIC_API_URL=http://backend-service:8000
 
# Build Next.js production app
RUN npm run build
 
# ─────────────────────────────────────────
# Stage 2 — RUN
# Only copy built output — no build tools!
# Keeps final image small and clean
# ─────────────────────────────────────────
FROM node:20-alpine AS runner
 
# Set working directory
WORKDIR /app
 
# Copy only what is needed to RUN the app
# (not the full node_modules or source code)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
 
# Expose port 3000 (Next.js default)
EXPOSE 3000
 
# Set hostname so Next.js listens on all interfaces
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
 
# Start the app
CMD ["node", "server.js"]
