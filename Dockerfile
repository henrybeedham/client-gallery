FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for native modules (better-sqlite3) during build
# Sometimes the build step itself needs these if it executes the code
RUN apk add --no-cache python3 make g++ vips-dev

COPY package*.json ./
RUN npm ci

COPY . .

# FIX: Create the directory expected by the database.
# Even though we don't need the actual DB for the build, the folder must exist
# so better-sqlite3 doesn't crash when the code is imported.
RUN mkdir -p /app/data

# Set the ENV so the build process knows where to look, just in case
ENV DATABASE_PATH=/app/data/gallery.db

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ vips-dev

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/build ./build

# Create directories for data and uploads
RUN mkdir -p /app/data /app/uploads

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/gallery.db
ENV UPLOAD_DIR=/app/uploads
# FIX: Increase body size limit for file uploads. 
# '0' disables the limit, allowing large file uploads. 
# Alternatively set to bytes, e.g., 536870912 for 512MB.
ENV BODY_SIZE_LIMIT=Infinity

EXPOSE 3000

CMD ["node", "build"]