import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SqliteStorage } from '../server/sqlite-storage';

test('SQLite imports JSON without altering it and persists committed data across reopen', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'glowwithsh-sqlite-test-'));
  const source = JSON.stringify({ products: [{ id: 'real-product' }], orders: [{ id: 'existing-order' }] });
  fs.writeFileSync(path.join(directory, 'db.json'), source);
  try {
    const store = new SqliteStorage(directory);
    assert.equal(store.read(), source);
    const updated = JSON.stringify({ products: [], orders: [{ id: 'existing-order' }, { id: 'new-order' }] });
    store.write(updated);
    assert.throws(() => store.write('invalid JSON'));
    assert.equal(store.read(), updated);
    store.close();
    const reopened = new SqliteStorage(directory);
    assert.equal(reopened.read(), updated);
    assert.equal(fs.readFileSync(path.join(directory, 'db.json'), 'utf8'), source);
    reopened.close();
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
