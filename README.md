# Client Gallery

A professional photography client gallery delivery platform built with SvelteKit. Designed for self-hosting with local file storage and SQLite database.

## Features

- **Albums & Categories**: Organize photos into albums with optional categories for filtering
- **Gallery Views**: Switch between grid and masonry layouts
- **Download Options**: Download individual photos, selected photos, or entire albums as ZIP
- **Mobile Responsive**: Optimized for all screen sizes with touch-friendly interactions
- **Dark Mode**: Default dark theme for optimal photo viewing
- **Admin Dashboard**: Simple admin interface for managing albums, photos, and categories
- **Single Admin User**: Environment-based credentials, no complex auth system
- **Local Storage**: All photos stored locally, no cloud dependencies
- **Docker Ready**: Easy deployment with Docker Compose

## Tech Stack

- **Framework**: SvelteKit with TypeScript
- **Database**: SQLite with better-sqlite3
- **Image Processing**: Sharp for thumbnails and optimized images
- **Styling**: Custom CSS with CSS variables for theming
- **Deployment**: Node.js adapter with Docker support

## Quick Start

### Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173

### Production with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/client-gallery.git
   cd client-gallery
   ```

2. Configure environment variables in `docker-compose.yml`:
   - `ADMIN_USERNAME`: Admin login username (default: admin)
   - `ADMIN_PASSWORD`: Admin login password (change this!)

3. Build and run:
   ```bash
   docker compose up -d
   ```

4. Access the gallery at http://localhost:3000

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | `changeme` |
| `DATABASE_PATH` | SQLite database file path | `./data/gallery.db` |
| `UPLOAD_DIR` | Photo storage directory | `./uploads` |

## Usage

### Admin Access

1. Navigate to `/admin` or click "Admin" in the navigation
2. Log in with your admin credentials
3. Create categories (optional) and albums
4. Upload photos to albums

### Client View

- Browse albums on the homepage
- Filter albums by category
- View albums with grid or masonry layout
- Download individual photos or entire albums
- Mobile-friendly lightbox for photo viewing

## Directory Structure

```
client-gallery/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── auth.ts      # Admin authentication
│   │   │   ├── db.ts        # Database operations
│   │   │   └── storage.ts   # File storage utilities
│   │   └── utils.ts         # Shared utilities
│   └── routes/
│       ├── admin/           # Admin pages
│       ├── album/[slug]/    # Album view page
│       └── api/             # API endpoints
├── uploads/                  # Photo storage (generated)
├── data/                     # SQLite database (generated)
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Photo Storage

Photos are processed and stored in three sizes:
- **Original**: Full resolution for downloads
- **Medium**: 1200px max dimension for lightbox viewing
- **Thumbnail**: 400px square crop for galleries

All images are stored locally in the `uploads` directory with the following structure:
```
uploads/
├── original/
├── medium/
└── thumbnail/
```

## License

MIT
