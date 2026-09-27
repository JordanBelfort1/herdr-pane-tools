import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMove, cleanLabel, menuInput } from '../src/core.js';

const source = { pane_id: 'w1:p1', terminal_id: 'term-a', tab_id: 'w1:t1', workspace_id: 'w1' };
const target = { pane_id: 'w2:p2', terminal_id: 'term-b', tab_id: 'w2:t2', workspace_id: 'w2' };
const request = { source, target, direction: 'right' };

test('move contract preserves exact source/target and selected direction across workspaces', () => {
  for (const direction of ['right', 'down']) {
    assert.deepEqual(validateMove({ ...request, direction }, [source, target]), [
      'pane', 'move', 'w1:p1', '--tab', 'w2:t2', '--target-pane', 'w2:p2', '--split', direction, '--focus'
    ]);
  }
});

test('stale or invalid requests fail closed before a mutation', () => {
  const cases = [
    [request, [target]],
    [request, [source]],
    [request, [{ ...source, terminal_id: 'replacement' }, target]],
    [request, [source, { ...target, terminal_id: 'replacement' }]],
    [request, [{ ...source, tab_id: 'w1:t9' }, target]],
    [request, [source, { ...target, tab_id: 'w2:t9' }]],
    [{ ...request, direction: '--new-workspace' }, [source, target]],
    [{ source, target: source, direction: 'right' }, [source]],
    [{ source, target: { ...target, tab_id: source.tab_id }, direction: 'right' }, [source, { ...target, tab_id: source.tab_id }]],
  ];
  for (const [req, panes] of cases) assert.throws(() => validateMove(req, panes));
});

test('untrusted terminal titles cannot inject terminal controls', () => {
  assert.equal(cleanLabel('hello\x1b[2J\nworld\x1b]52;c;secret\x07'), 'hello world');
  assert.equal(cleanLabel('a\u202Eb\u009bc'), 'abc');
});

test('keyboard and mouse input identify selection without executing a move', () => {
  assert.deepEqual(menuInput('\x1b[A'), { type: 'up' });
  assert.deepEqual(menuInput('\x1b[B'), { type: 'down' });
  assert.deepEqual(menuInput('\r'), { type: 'accept' });
  assert.deepEqual(menuInput('\x1b'), { type: 'back' });
  assert.deepEqual(menuInput('\x1b[<0;15;8M'), { type: 'click', row: 8 });
  assert.deepEqual(menuInput('\x1b[<0;15;8m'), { type: 'ignore' });
  assert.deepEqual(menuInput('\x03'), { type: 'quit' });
});
