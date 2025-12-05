FROM node:20-alpine AS base

# 1. Base stage with shared settings
WORKDIR /app
# We need these tools for Sharp/SQLite in all build stages
# Added libc6-compat which is often needed for prebuilt binaries on Alpine
RUN apk add --no-cache python3 make g++ vips-dev libc6-compat

FROM base AS builder

COPY package*.json ./

# 2. Install ALL dependencies
# CHANGED: 'npm ci' replaced with 'npm install'
# 'npm ci' strictly follows package-lock.json. If that lockfile was made on Mac/Windows,
# it might miss the Linux binaries for Sharp. 'npm install' will check the current OS 
# and download the correct binaries, preventing the "build from source" error.
RUN npm install

COPY . .

# 3. Build the SvelteKit/Node app
RUN npm run build

# 4. Remove devDependencies to prepare for production
RUN npm prune --production

FROM node:20-alpine AS production

WORKDIR /app

# 5. Production image only needs runtime libraries
RUN apk add --no-cache vips libc6-compat

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