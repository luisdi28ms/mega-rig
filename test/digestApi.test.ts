import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { readNight } from '../src/digest/readNight.js';

const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: 'runs' };

describe('GET /api/digest/:night', () => {
  it('returns the same rows readNight builds', async () => {
    const res = await createApp(config).request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(readNight('runs', '2026-10-28'));
  });

  it('answers 404 for a night with no file', async () => {
    const res = await createApp(config).request('/api/digest/2020-01-01');
    expect(res.status).toBe(404);
  });

  it('returns no rows for an empty file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-'));
    writeFileSync(join(dir, '2026-01-01.jsonl'), '');
    const res = await createApp({ ...config, runsDir: dir }).request('/api/digest/2026-01-01');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ night: '2026-01-01', rows: [], badLines: 0 });
  });

  it('counts a bad line and keeps the good rows', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-'));
    const good = JSON.stringify({ at: '2026-01-02T01:00:00+01:00', job: 'a/b', status: 'ok', owner: null });
    writeFileSync(join(dir, '2026-01-02.jsonl'), `${good}\nnot json\n`);
    const res = await createApp({ ...config, runsDir: dir }).request('/api/digest/2026-01-02');
    const body = (await res.json()) as { rows: unknown[]; badLines: number };
    expect(res.status).toBe(200);
    expect(body.rows).toHaveLength(1);
    expect(body.badLines).toBe(1);
  });
});
