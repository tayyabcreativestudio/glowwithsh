# GlowWithSH — Luxury Herbal Skincare Atelier & Storefront

A full-stack luxury e-commerce web application with customer storefront, inventory tracking, promotional discounts, WhatsApp concierge dispatch, customer review moderation, and administrative management console.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Launch development server with hot module replacement (HMR)
npm run dev
```

The storefront runs on `http://localhost:5173` and the admin console runs on `http://localhost:5174/admin`.

## Store management

- **Categories** lets you create storefront categories, choose their cover image from the media library, and assign any saved product. Draft and out-of-stock products can be assigned before they are published or restocked.
- **Media library** lets you upload multiple JPG, PNG, or WebP images, organize them by use, search existing assets, and copy their URLs.
- Image fields across products, categories, homepage content, founder content, awards, social posts, and pages include a **Choose from media** picker for reusing uploaded assets.
- **Pages** lets you create a custom URL, write page copy, add a cover image and SEO metadata, then save it as a draft or publish it. Published pages appear in the storefront's Pages menu and sitemap.

---

## 🔐 Administrative access

Set a unique `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a 32+ character `ADMIN_AUTH_SECRET` in your deployment environment. Production startup refuses to run without them. The admin console is served from `https://admin.glowwithsh.com`.

---

## 📦 Production Deployment

### 1. Direct Cloud Host (Render / Railway / DigitalOcean / Cloud Run / VPS)

Configure your service with the following settings:

| Setting | Value |
| :--- | :--- |
| **Node Version** | Node.js 20+ or 22+ |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm run start` (or `node dist/server.cjs`) |
| **Environment Variables** | Set every required value in `.env.example` through the host's secret manager |
| **Port** | Automatically bound from `process.env.PORT` (defaults to 3000) |

> [!TIP]
> **Persistent Storage**: To retain orders, inventory changes, uploaded images, and uploaded hero videos across redeployments, configure `DATA_DIR` and `UPLOADS_DIR` inside the host's persistent disk. The included Render blueprint mounts `/app/storage` and uses `/app/storage/data` plus `/app/storage/uploads`.

For this file-backed deployment, run exactly one application replica against that volume. Use PostgreSQL before scaling to multiple replicas.

### DNS and domains

Point `www.glowwithsh.com` and `admin.glowwithsh.com` to the same application service. Configure the platform to terminate HTTPS and forward the original host header. Requests to `glowwithsh.com` redirect to `www.glowwithsh.com`.

---

### 2. Docker Container Deployment

A multi-stage production `Dockerfile` is included in the root directory:

```bash
# Build production Docker image
docker build -t glowwithsh-store .

# Run container with persistent data volume
docker run -d -p 3000:3000 -v glowwithsh_data:/app/data --name glowwithsh glowwithsh-store
```

---

## 🛠 Project Scripts

- `npm run dev`: Starts the dev server with live hot reloading via `tsx server.ts`.
- `npm run lint`: Verifies TypeScript types with `tsc --noEmit`.
- `npm run build`: Bundles the Vite frontend and compiles the Node.js production server to `dist/server.cjs`.
- `npm run start`: Executes the production bundle `node dist/server.cjs`.

