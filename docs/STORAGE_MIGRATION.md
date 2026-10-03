# Durable storage and SQLite migration

The default remains `DB_DRIVER=json`; no live migration is performed by this patch. Optional `DB_DRIVER=sqlite` uses Node's built-in SQLite (Node 22.13+ or 24) with WAL, FULL synchronization and atomic transactions for the store snapshot. Catalog, orders, inventory, coupons and CMS stay together in one committed snapshot. This is a single-process adapter, not a normalized multi-worker SQL application. Run one application instance. The existing PostgreSQL script exports SQL only and does not switch the runtime to PostgreSQL.

Before deploying on Hostinger:

1. In File Manager/SSH, back up the current running application's `data/db.json` and every uploaded file. Local checkout data is not a substitute for production data. Keep the backup private: it contains customer records and password hashes.
2. Ask Hostinger support for an absolute writable directory outside `hbuilds/versions` and `public_html` that is retained during deploys. Do not paste `<HOSTINGER_PERSISTENT_PATH>` literally.
3. Copy the existing `db.json` into that directory's `data` folder and existing uploads into its `uploads` folder. Set `DATA_DIR` and `UPLOADS_DIR` to these actual paths.
4. Start with `DB_DRIVER=json`; check catalog count, existing orders and uploaded URLs. Back up again.
5. On Node 22.13+ or 24, set `DB_DRIVER=sqlite`. First startup creates `store.sqlite` and imports the existing JSON only if no SQLite state exists. The source JSON remains untouched. Future starts use SQLite as authoritative storage.
6. Verify existing orders, stock, admin login and media. Create a disposable test upload, restart, then verify it. Verify another redeployment retains the same state before accepting real orders.

Rollback: stop the app and export current SQLite content before changing drivers. The old JSON is the *pre-migration snapshot* and will not include new orders. Never switch back to it blindly. Read-only export:

```js
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const db = new DatabaseSync('/actual/persistent/data/store.sqlite', { readOnly: true });
const row = db.prepare('SELECT content FROM store_state WHERE id=1').get();
fs.writeFileSync('/private/backup/store-export.json', row.content, { mode: 0o600 });
db.close();
```

For backup of a running SQLite database, use SQLite's backup API/command or stop the app before copying the database and its WAL files. Test restoration. The local automated suite verifies import preservation, invalid-write rollback, reopening, and actual HTTP persistence. Hostinger redeployment retention and the Node 22 runtime are not verified here.
