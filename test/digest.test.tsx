import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: 'runs' };

describe('digest page', () => {
  it('renders 2026-10-28 sorted by job, marking retries >= 3', async () => {
    const res = await createApp(config).request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html.indexOf('digest/render')).toBeLessThan(html.indexOf('rig/rotate-logs'));
    expect(html).toContain('3 ⚠');
  });

  it('404s for a night with no file', async () => {
    const res = await createApp(config).request('/digest/2020-01-01');
    expect(res.status).toBe(404);
  });

  it('says nothing ran for an empty file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-'));
    writeFileSync(join(dir, '2026-01-01.jsonl'), '');
    const res = await createApp({ ...config, runsDir: dir }).request('/digest/2026-01-01');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('counts a bad line and still renders the good ones', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-'));
    const good = JSON.stringify({ at: '2026-01-02T01:00:00+01:00', job: 'a/b', status: 'ok', owner: null });
    writeFileSync(join(dir, '2026-01-02.jsonl'), `${good}\nnot json\n`);
    const res = await createApp({ ...config, runsDir: dir }).request('/digest/2026-01-02');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('a/b');
    expect(html).toContain('1 unreadable lines skipped');
  });
});
