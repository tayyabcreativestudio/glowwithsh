# GlowWithSH project handoff

This ZIP contains the complete project source, the current catalog and homepage content, and the three uploaded media files used by that content. Local customer records, admin password hashes, API keys, and `.env` secrets are excluded.

## Local preview

1. Install Node.js 22.
2. Extract this ZIP.
3. Open a terminal in the extracted project folder and run `npm ci`.
4. Run `npm run dev`.
5. Open the storefront at `http://localhost:5173` and the admin panel at `http://localhost:5174/admin`.

For a private preview, configure your own `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_AUTH_SECRET` in a local `.env` file before running it. Never use development credentials for a public deployment.

## Hostinger deployment

This project requires Node.js hosting. For a Hostinger Node.js app or VPS, use Node.js 22, build command `npm ci && npm run build`, and start command `npm run start`.

Configure these environment values in Hostinger's secret/environment settings:

```env
NODE_ENV=production
PORT=3000
APP_URL=https://www.glowwithsh.com
ADMIN_URL=https://admin.glowwithsh.com
DATA_DIR=/your/persistent/storage/data
UPLOADS_DIR=/your/persistent/storage/uploads
ADMIN_USERNAME=choose-a-private-admin-username
ADMIN_PASSWORD=choose-a-long-unique-password
ADMIN_AUTH_SECRET=generate-at-least-32-random-characters
```

Mount persistent storage for both `DATA_DIR` and `UPLOADS_DIR`. Keep a single application instance because this project currently uses file-based storage. Point `www.glowwithsh.com` and `admin.glowwithsh.com` to the same app and enable HTTPS for both.

Razorpay live payment keys are intentionally not included. Add them only after the merchant account is ready. Leave `SITE_GSTIN` blank unless the business has a valid registered GSTIN.

## Updating the project

The source of truth is the GitHub repository: https://github.com/tayyabcreativestudio/glowwithsh. Use this ZIP for handoff or offline review; deploy future source updates from GitHub where possible.
