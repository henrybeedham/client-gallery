FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package.json and bun.lockb (if it exists)
COPY package.json bun.lockb* ./

# Install all dependencies (removed --frozen-lockfile to prevent failure if lockfile is missing/outdated)
RUN bun install

COPY . .
RUN bun run build

FROM oven/bun:1-alpine AS production

WORKDIR /app

# Install dependencies for native modules (vips-dev for Sharp, etc.)
RUN apk add --no-cache python3 make g++ vips-dev

COPY package.json bun.lockb* ./

# Install only production dependencies
RUN bun install --production

COPY --from=builder /app/build ./build

# Create directories for data and uploads
RUN mkdir -p /app/data /app/uploads

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/gallery.db
ENV UPLOAD_DIR=/app/uploads

EXPOSE 3000

# Point explicitly to the entry file, as "bun build" is a reserved CLI command
CMD ["bun", "build/index.js"]