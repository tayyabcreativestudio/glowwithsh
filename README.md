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

The application runs on `http://localhost:3000`.

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
> **Persistent Storage**: To retain placed customer orders, inventory adjustments, and modified discounts across server redeployments, mount a persistent volume/disk to the `./data` directory.

For this file-backed deployment, run exactly one application replica against that volume. Use PostgreSQL before scaling to multiple replicas.

### Transactional order email

When `RESEND_API_KEY` and `ORDER_EMAIL_FROM` are configured, every Cash on Delivery or WhatsApp order receives an email with its order ID, item list, total, and thank-you note. Paid online orders receive the same email after Razorpay confirms payment. Failed delivery never cancels the order, and its status is stored on the order record for review.

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

