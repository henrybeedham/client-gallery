<div align="center">

# 📸 Client Gallery

### A Beautiful, Self-Hosted Photography Client Gallery Platform

Built with SvelteKit • Perfect for Professional Photographers • 100% Self-Hosted

[Features](#-features) • [Screenshots](#-screenshots) • [Quick Start](#-quick-start) • [Deployment](#-deployment) • [Environment Variables](#-environment-variables)

---

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Built with SvelteKit](https://img.shields.io/badge/Built%20with-SvelteKit-FF3E00?logo=svelte)](https://kit.svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

## 📖 About

**Client Gallery** is a professional photography client gallery delivery platform designed for photographers who want complete control over their photo delivery workflow. Self-host it on your own infrastructure with local file storage and SQLite database—no cloud dependencies, no monthly fees, no limits.

Perfect for wedding photographers, portrait photographers, event photographers, or anyone who needs to deliver galleries to clients with a beautiful, professional interface.

## ✨ Features

### 🎨 **Beautiful Client Experience**
- **Modern Dark Interface** - Optimized for photo viewing with a sleek dark theme
- **Grid & Masonry Layouts** - Choose between structured grid or dynamic masonry layouts
- **Responsive Lightbox** - Full-screen photo viewer with touch gestures and keyboard navigation
- **Mobile Optimized** - Perfect experience on phones, tablets, and desktops
- **Custom Branding** - Set custom primary colors per album for personalized galleries

### 📁 **Powerful Album Management**
- **Unlimited Albums** - Create as many albums as you need
- **Photo Tagging** - Organize photos with tags and allow clients to filter by tag
- **Password Protection** - Secure galleries with password protection
- **Expiration Dates** - Set expiration dates for time-limited gallery access
- **Custom Descriptions** - Add markdown-formatted descriptions to albums
- **Flexible Sorting** - Sort photos by date taken (newest/oldest) or random order
- **Show/Hide Controls** - Choose which albums appear on the homepage

### 💾 **Smart Photo Management**
- **Automatic Image Processing** - Generate optimized thumbnails and medium-sized previews
- **EXIF Data Extraction** - Automatically extract photo metadata including date taken
- **Bulk Upload** - Upload multiple photos at once
- **Drag & Drop Reordering** - Easily reorder photos in albums
- **Set Cover Photos** - Choose cover images for albums
- **Background Images** - Set custom background images for album pages

### ⬇️ **Download Features**
- **Individual Downloads** - Download single photos in full resolution
- **Bulk Selection** - Select multiple photos to download as a ZIP file
- **Download All** - One-click download entire albums as ZIP
- **Download Tracking** - Track which photos and albums clients download
- **Progress Indicators** - Real-time download progress with percentage

### 📊 **Analytics & Insights**
- **Page View Tracking** - See how many times albums are viewed
- **Download Analytics** - Track photo and album downloads
- **Per-Album Stats** - View detailed statistics for each album
- **Dashboard Overview** - At-a-glance statistics on your dashboard
- **Discord Notifications** - Optional webhook notifications for downloads (configurable)

### 🔐 **Simple Admin Interface**
- **Single Admin User** - No complex user management, just simple environment-based auth
- **Clean Dashboard** - Intuitive admin interface for managing everything
- **Quick Actions** - Fast access to create, edit, and delete albums
- **Photo Management** - Upload, reorder, tag, and delete photos easily
- **Live Preview** - View albums as clients see them

### 🚀 **Self-Hosted & Private**
- **Local Storage** - All photos stored on your server, complete ownership
- **SQLite Database** - Lightweight, file-based database (no complex setup)
- **No Cloud Dependencies** - Works completely offline after deployment
- **Docker Ready** - Easy deployment with Docker and Docker Compose
- **Low Resource Usage** - Efficient performance on modest hardware

## 📸 Screenshots

### Client Gallery View
![Homepage](https://github.com/user-attachments/assets/1351696d-4159-49a4-9564-db09686884db)
*Clean, modern album gallery homepage*

### Admin Dashboard
![Admin Dashboard](https://github.com/user-attachments/assets/76c04cae-f5fc-40b5-825c-c3166857900d)
*Comprehensive admin dashboard with statistics and quick access*

### Admin Login
![Admin Login](https://github.com/user-attachments/assets/4cc04bd4-7ce2-4cda-ac9c-ec41bd492f10)
*Simple, secure admin authentication*

## 🛠 Tech Stack

- **Frontend Framework**: [SvelteKit](https://kit.svelte.dev/) with TypeScript
- **Database**: [SQLite](https://www.sqlite.org/) with [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/) for fast, high-quality image optimization
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom dark theme
- **File Handling**: Node.js file system with [archiver](https://www.archiverjs.com/) for ZIP generation
- **Deployment**: Node.js adapter with Docker support

## 🚀 Quick Start

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/henrybeedham/client-gallery.git
   cd client-gallery
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
4. **Edit `.env` and set your credentials** (see [Environment Variables](#-environment-variables))

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:5173`

7. **Access the admin panel**
   
   Go to `http://localhost:5173/admin` and log in with your credentials

## 🐳 Deployment

### Docker Compose (Recommended)

**Client Gallery** is not currently available on Docker Hub, so you'll need to build from source.

1. **Clone the repository**
   ```bash
   git clone https://github.com/henrybeedham/client-gallery.git
   cd client-gallery
   ```

2. **Configure environment variables**
   
   Edit `docker-compose.yml` to set your environment variables, or create a `.env` file:
   
   ```yaml
   services:
     gallery:
       build: .
       container_name: client-gallery
       restart: unless-stopped
       ports:
         - '3000:3000'
       environment:
         - ADMIN_USERNAME=your_admin_username
         - ADMIN_PASSWORD=your_secure_password
         - DATABASE_PATH=/app/data/gallery.db
         - UPLOAD_DIR=/app/uploads
         - GALLERY_CONTACT_EMAIL=your@email.com
         - GALLERY_CONTACT_PHONE=+1234567890
         - PUBLIC_BASE_URL=https://yourdomain.com
       volumes:
         - ./data:/app/data
         - ./uploads:/app/uploads
   ```

3. **Build and start the container**
   ```bash
   docker compose up -d
   ```

4. **Access your gallery**
   
   Navigate to `http://localhost:3000` (or your configured domain)

### Deploying with Coolify 🆒

[Coolify](https://coolify.io/) is an open-source, self-hostable Heroku/Netlify/Vercel alternative. It makes deploying **Client Gallery** incredibly easy!

#### Prerequisites
- A Coolify instance set up and running
- A server with Docker installed

#### Deployment Steps

1. **In Coolify, create a new service**
   - Go to your Coolify dashboard
   - Click "New Resource" → "Docker Compose"

2. **Configure the service**
   - **Name**: `client-gallery` (or your preferred name)
   - **Git Repository**: `https://github.com/henrybeedham/client-gallery.git`
   - **Branch**: `main`
   - **Build Pack**: Docker (will auto-detect the Dockerfile)

3. **Set environment variables**
   
   In Coolify, add these environment variables:
   - `ADMIN_USERNAME` - Your admin username
   - `ADMIN_PASSWORD` - Your secure admin password  
   - `GALLERY_CONTACT_EMAIL` - Email shown on expired galleries
   - `GALLERY_CONTACT_PHONE` - Phone shown on expired galleries
   - `PUBLIC_BASE_URL` - Your full domain URL (e.g., `https://gallery.yourdomain.com`)
   - `DISCORD_WEBHOOK_URL` - (Optional) Discord webhook for download notifications

4. **Configure persistent storage**
   
   Add these volume mappings in Coolify:
   - `/app/data` → Persistent volume for database
   - `/app/uploads` → Persistent volume for photos

5. **Set up domain**
   - Configure your domain in Coolify (e.g., `gallery.yourdomain.com`)
   - Coolify will automatically handle SSL/TLS with Let's Encrypt

6. **Deploy**
   - Click "Deploy" and Coolify will build and start your gallery
   - First deployment may take a few minutes to build

7. **Access your gallery**
   - Navigate to your configured domain
   - Go to `/admin` to log in and start creating albums!

#### Coolify Benefits
- ✅ **Automatic SSL/TLS** - Free SSL certificates from Let's Encrypt
- ✅ **Easy Updates** - One-click deployments when you push updates
- ✅ **Automatic Backups** - Configure automatic backups for your data
- ✅ **Resource Monitoring** - Monitor CPU, RAM, and disk usage
- ✅ **Logs & Console** - Easy access to application logs

### Manual Deployment (VPS/Bare Metal)

1. **Install Node.js 20+**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone and build**
   ```bash
   git clone https://github.com/henrybeedham/client-gallery.git
   cd client-gallery
   npm install
   npm run build
   ```

3. **Set environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   node build
   ```

5. **Set up a process manager (recommended)**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start build/index.js --name client-gallery
   pm2 save
   pm2 startup
   ```

6. **Configure reverse proxy (Nginx example)**
   ```nginx
   server {
       listen 80;
       server_name gallery.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           client_max_body_size 100M;
       }
   }
   ```

## 🔧 Environment Variables

Create a `.env` file in the root directory with these variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| **`ADMIN_USERNAME`** | ✅ | `admin` | 👤 Admin login username - Change this to secure your admin panel |
| **`ADMIN_PASSWORD`** | ✅ | `changeme` | 🔒 Admin login password - **IMPORTANT: Change this immediately!** Use a strong, unique password |
| **`DATABASE_PATH`** | ❌ | `./data/gallery.db` | 💾 Path to SQLite database file - Can be relative or absolute path |
| **`UPLOAD_DIR`** | ❌ | `./uploads` | 📁 Directory for storing uploaded photos - Ensure sufficient disk space |
| **`GALLERY_CONTACT_EMAIL`** | ❌ | - | 📧 Contact email displayed on expired gallery pages for client support |
| **`GALLERY_CONTACT_PHONE`** | ❌ | - | 📞 Contact phone number displayed on expired gallery pages |
| **`DISCORD_WEBHOOK_URL`** | ❌ | - | 🔔 Discord webhook URL for download notifications - Get from Discord server settings |
| **`PUBLIC_BASE_URL`** | ❌ | `http://localhost:5173` | 🌐 Full base URL of your gallery (without trailing slash) - Used for copy link functionality. Example: `https://gallery.yourdomain.com` |

### Environment Variable Examples

```bash
# Minimal configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_super_secure_password_here

# Full production configuration
ADMIN_USERNAME=myphotography
ADMIN_PASSWORD=MyVerySecureP@ssw0rd!2024
DATABASE_PATH=/var/lib/client-gallery/data/gallery.db
UPLOAD_DIR=/var/lib/client-gallery/uploads
GALLERY_CONTACT_EMAIL=support@myphotography.com
GALLERY_CONTACT_PHONE=+1-555-123-4567
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/REPLACE_WITH_YOUR_WEBHOOK_ID/REPLACE_WITH_YOUR_WEBHOOK_TOKEN
PUBLIC_BASE_URL=https://gallery.myphotography.com
```

### 🔐 Security Best Practices

- **Change default credentials immediately** - Never use `admin/changeme` in production
- **Use strong passwords** - At least 16 characters with mixed case, numbers, and symbols
- **Protect your `.env` file** - Never commit it to version control (it's in `.gitignore`)
- **Regular backups** - Backup your `data/` and `uploads/` directories regularly
- **HTTPS in production** - Always use HTTPS in production (Coolify handles this automatically)

## 📂 Directory Structure

```
client-gallery/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── auth.ts           # Admin authentication logic
│   │   │   ├── db.ts             # SQLite database operations
│   │   │   └── storage.ts        # File storage utilities
│   │   └── utils.ts              # Shared utility functions
│   ├── routes/
│   │   ├── admin/                # Admin panel pages
│   │   │   ├── albums/[id]/      # Album edit page
│   │   │   ├── albums/new/       # Create new album
│   │   │   ├── login/            # Admin login
│   │   │   └── +page.svelte      # Admin dashboard
│   │   ├── album/[slug]/         # Public album view
│   │   ├── api/                  # API endpoints
│   │   │   ├── download/         # Download endpoints
│   │   │   └── photos/           # Photo serving endpoints
│   │   └── +page.svelte          # Homepage
│   ├── app.css                   # Global styles
│   └── app.html                  # HTML template
├── static/                       # Static assets
├── data/                         # 💾 SQLite database (generated)
├── uploads/                      # 📸 Photo storage (generated)
│   ├── original/                 # Full resolution photos
│   ├── medium/                   # 1200px max preview images
│   └── thumbnail/                # 400px square thumbnails
├── Dockerfile                    # Docker image definition
├── docker-compose.yml            # Docker Compose configuration
├── .env.example                  # Example environment variables
├── package.json                  # NPM dependencies
├── svelte.config.js              # SvelteKit configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── vite.config.ts                # Vite build configuration
```

## 📷 Photo Storage & Processing

When you upload photos to **Client Gallery**, they are automatically processed into three sizes for optimal performance:

### Image Sizes

| Size | Dimensions | Purpose | Storage |
|------|------------|---------|---------|
| **Original** | No resize | Full resolution for client downloads | `uploads/original/` |
| **Medium** | 1200px max | Lightbox viewing and preview | `uploads/medium/` |
| **Thumbnail** | 400×400px | Gallery grid/masonry thumbnails | `uploads/thumbnail/` |

### Image Processing Features

- ✅ **Automatic EXIF extraction** - Preserves date taken, camera info
- ✅ **Format optimization** - Converts to optimal web formats
- ✅ **Quality tuning** - Balanced quality vs. file size
- ✅ **Responsive serving** - Right size for each use case
- ✅ **Fast processing** - Uses Sharp for high-performance image manipulation

## 💡 Usage Guide

### For Administrators

1. **Login** - Navigate to `/admin` and log in with your credentials
2. **Create Album** - Click "New Album" and fill in the details:
   - Title, slug (URL-friendly name), and description
   - Set visibility (public/private) and homepage visibility
   - Optional: password protection and expiration date
   - Choose layout (grid or masonry) and sort order
3. **Upload Photos** - Open the album and upload photos (supports multiple files)
4. **Organize** - Drag to reorder photos, add tags, set cover image
5. **Share** - Copy the album link and share with your client

### For Clients

1. **Browse** - View all available albums on the homepage
2. **Open Album** - Click an album to view photos
3. **Filter** - Use tags to filter photos (if tags are set up)
4. **View Photos** - Click any photo for full-screen lightbox view
5. **Download** - Download individual photos or select multiple to download as ZIP
6. **Download All** - Click "Download All" to get the entire album as a ZIP file

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by photographers, for photographers**

[⬆ Back to Top](#-client-gallery)

</div>
