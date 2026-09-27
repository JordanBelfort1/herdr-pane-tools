import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { topology } from './herdr.js';
import { cleanLabel, decodeInput } from './core.js';

const jobPath = process.env.PANE_TOOLS_JOB;
let job;
let data;
let screen = 'source';
let selected = 0;
let offset = 0;
let options = [];
let visible = [];
let source, destination, target, direction;
let message = '';
let finished = false;
let submitting = false;

function label(pane) {
  const ws = data.workspaces.find(w => w.workspace_id === pane.workspace_id);
  const tab = data.tabs.find(t => t.tab_id === pane.tab_id);
  return cleanLabel(`${ws?.label || pane.workspace_id} / ${tab?.label || pane.tab_id} / ${pane.label || pane.terminal_title_stripped || pane.agent || 'Terminal'} [${pane.pane_id}]`);
}

function isMenu(pane) {
  return pane.pane_id === process.env.HERDR_PANE_ID || pane.label === 'Pane Tools';
}

function buildOptions() {
  if (screen === 'source') options = data.panes.filter(p => !isMenu(p)).map(p => ({ text: label(p), value: p }));
  if (screen === 'tab') options = data.tabs.filter(t => t.tab_id !== source.tab_id && data.panes.some(p => p.tab_id === t.tab_id && !isMenu(p)))
    .map(t => ({ text: cleanLabel(`${data.workspaces.find(w => w.workspace_id === t.workspace_id)?.label || t.workspace_id} / ${t.label || t.tab_id} [${t.tab_id}]`), value: t }));
  if (screen === 'target') options = data.panes.filter(p => p.tab_id === destination.tab_id && !isMenu(p)).map(p => ({ text: label(p), value: p }));
  if (screen === 'direction') options = [{ text: 'RIGHT - side by side', value: 'right' }, { text: 'DOWN - stacked', value: 'down' }];
  if (screen === 'confirm') options = [{ text: 'Cancel - keep current layout', value: false }, { text: 'Move this running pane', value: true }];
}

function render() {
  if (finished) return;
  const width = Math.max(10, (process.stdout.columns || 80) - 2);
  const height = process.stdout.rows || 24;
  const capacity = Math.max(1, height - 10);
  if (selected < offset) offset = selected;
  if (selected >= offset + capacity) offset = selected - capacity + 1;
  const titles = { source: '1 / 5  Choose the existing pane to move', tab: '2 / 5  Choose destination tab', target: '3 / 5  Split beside which pane?', direction: '4 / 5  Choose split direction', confirm: '5 / 5  Confirm move' };
  const clip = text => [...cleanLabel(text)].slice(0, width).join('');
  const lines = ['PANE TOOLS', titles[screen], '',
    source ? `From: ${label(source)}` : 'Choose an existing terminal. Its process keeps running.',
    target ? `To: ${label(target)}${direction ? ` (${direction})` : ''}` : 'Esc: back/cancel | Up/Down or j/k: select | Enter or click: choose', ''];
  visible = options.slice(offset, offset + capacity);
  for (let i = 0; i < visible.length; i++) lines.push(`${offset + i === selected ? '> ' : '  '}${visible[i].text}`);
  if (!options.length) lines.push('No other tab available. Open a destination tab first.');
  lines.push('', message || `${options.length ? selected + 1 : 0}/${options.length} | Esc: back | Ctrl+C: cancel`);
  process.stdout.write('\x1b[H\x1b[2J' + lines.map(clip).join('\r\n'));
}

function finish(code = 0, preserveJob = false) {
  if (finished) return;
  finished = true;
  process.stdout.write('\x1b[?1000l\x1b[?1006l\x1b[?25h\x1b[?1049l');
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  if (!preserveJob && jobPath) { try { unlinkSync(jobPath); } catch { /* already removed */ } }
  process.exit(code);
}

function back() {
  if (screen === 'source') return finish();
  const order = ['source', 'tab', 'target', 'direction', 'confirm'];
  screen = order[order.indexOf(screen) - 1];
  if (screen === 'source') { source = undefined; destination = undefined; target = undefined; direction = undefined; }
  if (screen === 'tab') { destination = undefined; target = undefined; direction = undefined; }
  if (screen === 'target') { target = undefined; direction = undefined; }
  if (screen === 'direction') direction = undefined;
  selected = offset = 0;
  buildOptions(); render();
}

function accept() {
  if (submitting) return;
  if (!options[selected]) return;
  const choice = options[selected].value;
  if (screen === 'confirm') {
    if (!choice) return finish();
    const menu = data.panes.find(p => p.pane_id === process.env.HERDR_PANE_ID);
    if (!menu) { message = 'Cannot identify menu terminal. Cancel and reopen.'; return render(); }
    const request = { ...job, source, target, direction, menuTerminal: menu.terminal_id };
    writeFileSync(jobPath, JSON.stringify(request), { mode: 0o600 });
    submitting = true;
    // A worker outlives this overlay, but cannot mutate until this menu is gone.
    const child = spawn(process.execPath, [join(dirname(fileURLToPath(import.meta.url)), 'worker.js'), jobPath], {
      detached: true, windowsHide: true, stdio: 'ignore', env: process.env,
    });
    child.once('error', error => { submitting = false; message = cleanLabel(error.message); render(); });
    child.once('spawn', () => { child.unref(); finish(0, true); });
    return;
  }
  if (screen === 'source') { source = choice; screen = 'tab'; }
  else if (screen === 'tab') { destination = choice; screen = 'target'; }
  else if (screen === 'target') { target = choice; screen = 'direction'; }
  else if (screen === 'direction') { direction = choice; screen = 'confirm'; }
  selected = offset = 0;
  message = '';
  buildOptions(); render();
}

try {
  if (!jobPath || !process.stdin.isTTY) throw new Error('Open Pane Tools using its Herdr action.');
  job = JSON.parse(readFileSync(jobPath, 'utf8'));
  data = topology();
  buildOptions();
  selected = Math.max(0, options.findIndex(o => o.value.pane_id === job.origin));
  process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stdout.write('\x1b[?1049h\x1b[?25l\x1b[?1000h\x1b[?1006h');
  function handle(input) {
    if (submitting || finished) return;
    if (input.type === 'quit') return finish();
    if (input.type === 'back') return back();
    if (input.type === 'up') selected = Math.max(0, selected - 1);
    if (input.type === 'down') selected = Math.min(Math.max(0, options.length - 1), selected + 1);
    if (input.type === 'accept') return accept();
    if (input.type === 'click') {
      const index = input.row - 7;
      if (index >= 0 && index < visible.length) { selected = offset + index; return accept(); }
    }
    render();
  }
  let pending = '';
  let escapeTimer;
  process.stdin.on('data', chunk => {
    clearTimeout(escapeTimer);
    const decoded = decodeInput(pending + chunk);
    pending = decoded.pending;
    for (const event of decoded.events) handle(event);
    if (pending) escapeTimer = setTimeout(() => {
      const remaining = decodeInput(pending, true);
      pending = '';
      for (const event of remaining.events) handle(event);
    }, 80);
  });
  process.stdout.on('resize', render);
  process.on('SIGTERM', () => finish());
  process.on('SIGINT', () => finish());
  render();
} catch (error) {
  console.error(cleanLabel(error.message));
  finish(1);
}
