# Herdr Pane Tools

**Move an already-running terminal into a split — from a keyboard and mouse menu.**

A native Windows plugin for [Herdr](https://herdr.dev). Pick a source pane,
destination tab, target pane, and right/down placement. Confirm to move the
existing session; no agent restart or command IDs to type.

```text
PANE TOOLS
5 / 5  Confirm move

From: my-project / Agent / Claude
To: my-project / Work / Terminal (right)

> Cancel - keep current layout
  Move this running pane
```

## Requirements

- Windows, Herdr **0.9.1+**, Node.js **22+** on PATH.
- Tested on native Windows with Herdr 0.9.1 and Node 22.
- No npm install, Rust, Go, Bash, fzf, or administrator rights required.
- macOS/Linux are not advertised until validated.

## Install

```powershell
herdr plugin install JordanBelfort1/herdr-pane-tools
```

Add this to Herdr's `config.toml` (normally `%APPDATA%\herdr\config.toml`):

```toml
[[keys.command]]
key = "prefix+shift+m"
type = "plugin_action"
command = "jordanbelfort1.pane-tools.open"
description = "Move an existing pane"
```

Keep existing entries. If this key is already used, choose another free key.
Reload without ending any sessions:

```powershell
herdr server reload-config
```

**Press Ctrl+B, release, then Shift+M.** The default prefix is Ctrl+B; use your
configured prefix if different. Or open from a shell:

```powershell
herdr plugin action invoke jordanbelfort1.pane-tools.open
```

## Move a pane

1. Focus the terminal you want to move and open the menu. It is preselected.
2. Select its destination tab (in this or another workspace).
3. Select the existing pane beside which to split.
4. Choose **RIGHT** (side by side) or **DOWN** (stacked).
5. Select **Move this running pane** and press Enter.

Use Up/Down or j/k to navigate, Enter to choose, or click a row. Mouse wheel
scrolls the selection. Esc goes back; Esc on the first screen or Ctrl+C cancels.
Confirmation defaults to **Cancel**. A notification reports success or failure.
The moved pane receives focus. Menus show live-session metadata, never transcripts.

## Scope and limitations

- Moves to **another existing tab**, including another workspace. Create a
  destination tab first if needed. Same-tab re-splitting, swap, left/up placement,
  new tabs, and whole-tab moves are not part of v0.1.
- Open one menu at a time. A snapshot is taken when it opens, and the selected
  source and target identities are rechecked immediately before the move.
- An overlay must fully close before the detached worker moves anything; otherwise
  it fails without moving. The worker performs one mutation, with no retry.
- Terminal/process identity is preserved by Herdr. Moving across workspaces can
  change the pane ID; a running process retains its launch-time environment.
- Other plugins may manage their own layout (for example an auto-opening sidebar).
  Prefer moving your shell/agent panels rather than those managed UI panes.
- Small terminals show a scrollable list; use at least 40 columns by 12 rows.
- Reopen the menu if a tab/pane closed or moved while you were choosing.
- Keybindings are separate from plugin installation. Uninstalling does not remove
  the binding you added to Herdr's configuration.

## Troubleshooting

```powershell
node --version
herdr plugin list
herdr plugin log list
```

If the plugin cannot find Node, make Node available to the Herdr server's PATH.
Do not stop a server containing active work just to change PATH.

The most recent move result is stored as `last-result.json` in the plugin's
`HERDR_PLUGIN_STATE_DIR` (the Herdr-managed **state** directory, not config).
It contains pane IDs and timestamps; nothing is uploaded. A timeout after the
move was submitted is ambiguous: inspect your layout before trying again.

## Development

```powershell
git clone https://github.com/JordanBelfort1/herdr-pane-tools.git
cd herdr-pane-tools
npm test
npm run check
herdr plugin link .
```

The unit suite protects identity validation, allowed directions, terminal-control
sanitization, and input parsing. The [Windows manual smoke checklist](docs/testing.md)
checks the actual Herdr transport, menu lifecycle, layout and process preservation.
CI does not control a live Herdr session.

Original implementation, MIT licensed. Uses Herdr's public CLI, not private sockets.
