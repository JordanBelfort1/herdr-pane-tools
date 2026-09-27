# Windows manual smoke

Run in an attached, disposable Herdr workspace. Never use active user agents as
test subjects. Record Herdr/Node versions and retain terminal identity and PID
before and after the move. Remove only the workspace created for the smoke.

1. Create a test workspace and two tabs with idle shells.
2. Link the plugin, focus a shell, open the action.
3. Verify the menu renders, preselects that shell and shows readable tab names.
4. Cancel with Esc. Verify the menu disappears and shell remains in its tab.
5. Reopen, select the destination shell and RIGHT, then confirm. Verify the source
   has moved to the target tab, is focused, and retains terminal ID and shell PID.
6. Repeat to another test tab with DOWN. Verify its split geometry and identity.
7. Start a second invocation while the menu is open. Verify it reports the existing
   menu rather than overwriting its selection.
8. Close a selected test destination before confirming. Verify an error notification
   and no source move. Repeat with a source that closed before confirmation.
9. Exercise mouse selection, resizing, back from confirmation and Ctrl+C cancellation.
10. Repeat action opening after installation from the GitHub repository, rather than
    only `plugin link`. Verify a configured key appears in Herdr keybinding help.

## Initial verification

Native Windows, Herdr 0.9.1, Node 22.22.3:

- Menu rendering and keyboard cancellation verified in disposable shells.
- RIGHT and DOWN moves verified against live Herdr; source shell PID and terminal
  identity retained. No active user terminal was moved.
- Automated suite covers stale source/target identity, wrong tab, same-tab moves,
  invalid direction, terminal control injection and fragmented/coalesced input.
- Duplicate invocation kept one menu, without replacing the original selection.
- Closing the selected destination before confirming produced an error and kept
  the source in its original tab (live Windows test).
- Installation directly from GitHub and opening/cancelling its menu verified.
- Physical mouse clicking and all terminal resize combinations have not been
  manually validated; the input parser has automated mouse-report coverage.

CI verifies Node tests and syntax on Windows. It does not prove live Herdr behavior.
