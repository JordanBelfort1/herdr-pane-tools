# Herdr Pane Tools

Build a Windows-native Herdr plugin that lets a user move an existing running
terminal into a split in another tab without typing pane IDs. Publish under
JordanBelfort1/herdr-pane-tools with the herdr-plugin topic and an MIT license.

## Scope

- Node.js 22+, Herdr 0.9.1+, no npm dependencies or build step.
- Windows is the initially validated platform. No untested platform claims.
- Keyboard and mouse menu: source pane, destination tab, target pane, right/down
  split, explicit final confirmation. Existing processes remain running.
- Open from a configured shortcut (suggested prefix+shift+m); Esc cancels/back.
- Show current pane preselected, allow choosing another. Show readable workspace,
  tab and pane names. Filter this plugin's transient menu panes.
- Do not close agents, restart Herdr, run shell command strings, inspect terminal
  contents, or send prompts. Read only topology and labels; move only on confirmation.
- Fresh topology validation immediately before moving; reject vanished or changed
  terminals and same-tab destinations. No automatic retry of a mutation.
- An overlay exits before a detached worker applies a move. The worker waits for
  the exact menu terminal to disappear, fails closed on timeout, and reports result
  in a local status file and Herdr notification. Never kill an existing process.
- Per-invocation context files in Herdr state directory, no shared target file.
- Bounded automated tests for contracts plus real Windows smoke using disposable
  shells and cancellation, never move the user's active work during tests.

## Alternatives

Porting the existing macOS/Linux plugin inherits its overlay and process-launch
assumptions. A PowerShell-only menu limits mouse interaction. A small original
Node implementation gives us explicit Windows process control and tests.

## Release evidence

Publish source, installation/shortcut docs, CI on Windows, and a tagged release.
Install using the exact public GitHub source and verify registration and menu.
No repository-specific paths, agent transcripts or user configuration in source.
