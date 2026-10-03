import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

/** Transactional snapshot storage for this store's single-process architecture.
 * JSON import is non-destructive; SQLite becomes authoritative after import.
 * Keep DATA_DIR on durable storage. This is not a multi-worker repository.
 */
export class SqliteStorage {
  private database: any;
  constructor(directory: string) {
    fs.mkdirSync(directory, { recursive: true });
    const require = createRequire(path.join(process.cwd(), 'package.json'));
    const { DatabaseSync } = require('node:sqlite');
    this.database = new DatabaseSync(path.join(directory, 'store.sqlite'));
    this.database.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=10000; CREATE TABLE IF NOT EXISTS store_state (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, content TEXT NOT NULL CHECK(json_valid(content)));');
    const jsonFile = path.join(directory, 'db.json');
    if (!this.read() && fs.existsSync(jsonFile)) {
      const content = fs.readFileSync(jsonFile, 'utf8');
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed.products) || !Array.isArray(parsed.orders)) throw new Error('Invalid JSON database; migration stopped.');
      this.write(content);
    }
  }
  read(): string | null {
    return this.database.prepare('SELECT content FROM store_state WHERE id=1').get()?.content ?? null;
  }
  write(content: string): void {
    this.database.exec('BEGIN IMMEDIATE');
    try {
      this.database.prepare('INSERT INTO store_state(id, revision, content) VALUES (1, 1, ?) ON CONFLICT(id) DO UPDATE SET revision=revision+1, content=excluded.content').run(content);
      this.database.exec('COMMIT');
    } catch (error) { this.database.exec('ROLLBACK'); throw error; }
  }
  close(): void { this.database.close(); }
}
