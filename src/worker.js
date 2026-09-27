import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { call } from './herdr.js';
import { validateMove, cleanLabel } from './core.js';

const jobPath = process.argv[2];
let report;
try {
  if (!jobPath) throw new Error('Missing move request.');
  const job = JSON.parse(readFileSync(jobPath, 'utf8'));
  if (!job.menuTerminal || Date.now() - job.created > 30 * 60 * 1000) throw new Error('Move request expired. Open the menu again.');
  let panes;
  const deadline = Date.now() + 15000;
  do {
    panes = call('pane', 'list').panes;
    if (!Array.isArray(panes)) throw new Error('Invalid pane list.');
    if (!panes.some(p => p.terminal_id === job.menuTerminal)) break;
    await setTimeout(200);
  } while (Date.now() < deadline);
  if (panes.some(p => p.terminal_id === job.menuTerminal)) throw new Error('Menu did not close; no move was performed.');
  // Let Herdr finish restoring the overlay before validating and mutating once.
  await setTimeout(350);
  panes = call('pane', 'list').panes;
  const args = validateMove(job, panes);
  const result = call(...args);
  const live = call('pane', 'list').panes.find(p => p.terminal_id === job.source.terminal_id);
  if (!live || live.tab_id !== job.target.tab_id) throw new Error('Move result could not be verified. Check layout before retrying.');
  report = { ok: true, at: new Date().toISOString(), pane: live.pane_id, tab: live.tab_id, terminal: live.terminal_id, result };
} catch (error) {
  report = { ok: false, at: new Date().toISOString(), error: cleanLabel(error.message) };
}
if (jobPath) {
  // Local evidence only, never uploaded. Clean the request after either result.
  writeFileSync(join(dirname(jobPath), 'last-result.json'), JSON.stringify(report, null, 2));
  try { unlinkSync(jobPath); } catch { /* already removed */ }
}
try {
  call('notification', 'show', report.ok ? 'Pane moved' : 'Pane Tools: move failed',
    '--body', report.ok ? 'Your running session is now in the selected tab.' : report.error, '--sound', 'none');
} catch { /* notification failure cannot change the committed move */ }
process.exitCode = report.ok ? 0 : 1;
