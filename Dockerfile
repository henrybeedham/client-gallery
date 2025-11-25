FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ vips-dev

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/build ./build

# Create directories for data and uploads
RUN mkdir -p /app/data /app/uploads

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/gallery.db
ENV UPLOAD_DIR=/app/uploads

EXPOSE 3000

CMD ["node", "build"]
