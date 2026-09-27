import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { call } from './herdr.js';

try {
  const state = process.env.HERDR_PLUGIN_STATE_DIR;
  if (!state || !process.env.HERDR_BIN_PATH) throw new Error('Launch this plugin through Herdr.');
  if (call('pane', 'list').panes.some(p => p.label === 'Pane Tools')) {
    call('notification', 'show', 'Pane Tools is already open', '--body', 'Finish or cancel the open menu with Esc before opening another.', '--sound', 'none');
    process.exit(0);
  }
  let context = {};
  try { context = JSON.parse(process.env.HERDR_PLUGIN_CONTEXT_JSON || '{}'); } catch { /* optional selection */ }
  const origin = context.focused_pane_id || context.pane_id || process.env.HERDR_PANE_ID;
  if (!origin) throw new Error('Focus a terminal pane before opening Pane Tools.');
  mkdirSync(state, { recursive: true });
  const job = join(state, `job-${randomUUID()}.json`);
  writeFileSync(job, JSON.stringify({ origin, created: Date.now() }), { flag: 'wx', mode: 0o600 });
  try {
    call('plugin', 'pane', 'open', '--plugin', 'jordanbelfort1.pane-tools', '--entrypoint', 'menu',
      '--cwd', dirname(fileURLToPath(import.meta.url)),
      '--env', `PANE_TOOLS_JOB=${job}`, '--focus');
  } catch (error) {
    unlinkSync(job);
    throw error;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
