import { stripVTControlCharacters } from 'node:util';

export function cleanLabel(value) {
  return stripVTControlCharacters(String(value ?? ''))
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/g, '');
}

export function validateMove(request, panes) {
  if (!['right', 'down'].includes(request.direction)) throw new Error('Invalid split direction.');
  for (const name of ['source', 'target']) {
    const expected = request[name];
    if (!expected?.terminal_id || !expected?.pane_id) throw new Error(`Missing ${name} identity.`);
    const live = panes.find(p => p.pane_id === expected.pane_id);
    if (!live || live.terminal_id !== expected.terminal_id || live.tab_id !== expected.tab_id || live.workspace_id !== expected.workspace_id) {
      throw new Error(`The ${name} pane changed or closed. Open the menu again.`);
    }
  }
  if (request.source.tab_id === request.target.tab_id) throw new Error('Choose a different tab.');
  return ['pane', 'move', request.source.pane_id, '--tab', request.target.tab_id,
    '--target-pane', request.target.pane_id, '--split', request.direction, '--focus'];
}

export function menuInput(data) {
  if (data === '\x03') return { type: 'quit' };
  if (data === '\x1b' || data === '\x7f' || data === 'q') return { type: 'back' };
  if (data === '\x1b[A' || data === 'k') return { type: 'up' };
  if (data === '\x1b[B' || data === 'j') return { type: 'down' };
  if (data === '\r' || data === '\n') return { type: 'accept' };
  const mouse = /^\x1b\[<(\d+);\d+;(\d+)([Mm])$/.exec(data);
  if (mouse?.[3] === 'M') {
    if (mouse[1] === '0') return { type: 'click', row: Number(mouse[2]) };
    if (mouse[1] === '64') return { type: 'up' };
    if (mouse[1] === '65') return { type: 'down' };
  }
  return { type: 'ignore' };
}

// Terminal reads are chunks, not keys: retain incomplete escape sequences.
export function decodeInput(buffer, flush = false) {
  const events = [];
  while (buffer) {
    let length = 1;
    if (buffer.startsWith('\x1b')) {
      const sequence = /^\x1b\[[0-9;<:?]*[A-Za-z~]/.exec(buffer);
      if (sequence) length = sequence[0].length;
      else if (!flush && /^\x1b(?:\[[0-9;<:?]*)?$/.test(buffer)) break;
      else if (buffer.length > 1) { buffer = buffer.slice(2); continue; }
    }
    events.push(menuInput(buffer.slice(0, length)));
    buffer = buffer.slice(length);
  }
  return { events, pending: buffer };
}
