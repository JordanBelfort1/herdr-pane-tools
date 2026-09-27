import { spawnSync } from 'node:child_process';
import { cleanLabel } from './core.js';

// argv only: titles and pane IDs must never be interpolated into a shell.
export function call(...args) {
  const res = spawnSync(process.env.HERDR_BIN_PATH || 'herdr', args, {
    encoding: 'utf8', windowsHide: true, timeout: 15000, maxBuffer: 8 * 1024 * 1024,
  });
  if (res.error) throw new Error(`Herdr unavailable: ${res.error.message}`);
  let body;
  try { body = JSON.parse(res.stdout || res.stderr); } catch { /* report raw CLI error below */ }
  if (res.status !== 0 || body?.error) {
    throw new Error(cleanLabel(body?.error?.message || res.stderr || 'Herdr command failed.'));
  }
  return body?.result ?? {};
}

export function topology() {
  const panes = call('pane', 'list').panes;
  const workspaces = call('workspace', 'list').workspaces;
  if (!Array.isArray(panes) || !Array.isArray(workspaces)) throw new Error('Unsupported Herdr topology response.');
  const tabs = workspaces.flatMap(w => call('tab', 'list', '--workspace', w.workspace_id).tabs ?? []);
  return { panes, workspaces, tabs };
}
