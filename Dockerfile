FROM node:20-alpine AS base

# 1. Base stage with shared settings
WORKDIR /app
# We need these tools for Sharp/SQLite in all build stages
RUN apk add --no-cache python3 make g++ vips-dev

FROM base AS builder

COPY package*.json ./

# 2. Install ALL dependencies (including devDependencies)
# This ensures 'node-addon-api' is present so Sharp can build from source if needed
RUN npm ci

COPY . .

# 3. Build the SvelteKit/Node app
RUN npm run build

# 4. Remove devDependencies to prepare for production
# This leaves us with a clean node_modules folder containing compiled binaries
RUN npm prune --production

FROM node:20-alpine AS production

WORKDIR /app

# 5. Production image only needs runtime libraries (vips), not build tools (python/make/g++)
# This makes the final image much smaller and safer
RUN apk add --no-cache vips

# Copy the built app and the production-ready node_modules from the builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Setup directories
RUN mkdir -p /app/data /app/uploads

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/gallery.db
ENV UPLOAD_DIR=/app/uploads
ENV BODY_SIZE_LIMIT=Infinity

EXPOSE 3000

CMD ["node", "build"]