# CHANGED: Switch from 'alpine' to 'slim'.
# 'slim' is Debian-based, which allows Sharp to download pre-built binaries 
# instead of compiling them from source.
FROM node:20-slim AS builder

WORKDIR /app

# Install build tools just in case specific native modules (like better-sqlite3) 
# need a fallback, but Sharp should now use pre-builts.
RUN apt-get update && apt-get install -y python3 make g++

COPY package*.json ./
RUN npm install

COPY . .

# Create the directory expected by the database.
RUN mkdir -p /app/data

ENV DATABASE_PATH=/app/data/gallery.db

RUN npm run build

# -----------------------------------------

FROM node:20-slim AS production

WORKDIR /app

# NOTE: We do NOT need to install python/make/g++ here anymore.
# On the 'slim' image, Sharp will find and download the correct binary automatically.

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/build ./build

# Create directories for data and uploads
RUN mkdir -p /app/data /app/uploads

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/gallery.db
ENV UPLOAD_DIR=/app/uploads
ENV BODY_SIZE_LIMIT=Infinity

EXPOSE 3000

CMD ["node", "build"]