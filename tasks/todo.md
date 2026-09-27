# Implementation plan

Goal: a Windows Herdr menu for moving running panels between tabs as splits.
Architecture: CLI adapter + validated move contract + ANSI terminal menu + a
detached post-menu worker. Spec: ../docs/design.md. Execute inline.

- [x] Contract: test source/target identity, stale layout, same-tab rejection,
  exact split direction and unchanged process identity. Implement core and adapter.
- [x] Menu: keyboard, mouse, back/cancel, resize, explicit confirmation, launcher
  and deferred worker. Test input interpretation and label sanitization.
- [x] Windows smoke: create disposable shells, cancel safely, move right/down,
  verify same terminal ID and process, remove only owned temporary workspace.
- [x] Docs, MIT license, manifest, Windows CI, review and publication.
- [x] GitHub install, shortcut backup/reload, final menu verification.

Review focus: no shell interpolation; menu lifetime before move; duplicate opens;
vanished terminals; small terminal sizes; preserving existing shortcuts.

Evidence: five Node test groups pass; live Windows smoke preserves terminal ID
and shell PID for right/down moves. Cancel and a vanished destination cause no
move. Duplicate opens keep the original menu. GitHub-installed menu opens.
Implementation review on 7c3d6b2 reports no actionable findings. Windows CI passes
on Node 22 and 24. See docs/testing.md for runtime coverage boundaries.
