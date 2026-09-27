# Implementation plan

Goal: a Windows Herdr menu for moving running panels between tabs as splits.
Architecture: CLI adapter + validated move contract + ANSI terminal menu + a
detached post-menu worker. Spec: ../docs/design.md. Execute inline.

- [ ] Contract: test source/target identity, stale layout, same-tab rejection,
  exact split direction and unchanged process identity. Implement core and adapter.
- [ ] Menu: keyboard, mouse, back/cancel, resize, explicit confirmation, launcher
  and deferred worker. Test input interpretation and label sanitization.
- [ ] Windows smoke: create disposable shells, cancel safely, move right/down,
  verify same terminal ID and process, remove only owned temporary workspace.
- [ ] Docs, MIT license, manifest, Windows CI, review and publication.
- [ ] GitHub install, shortcut backup/reload, final menu verification.

Review focus: no shell interpolation; menu lifetime before move; duplicate opens;
vanished terminals; small terminal sizes; preserving existing shortcuts.
