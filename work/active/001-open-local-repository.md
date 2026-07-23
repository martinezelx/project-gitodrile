---
id: 001
title: Open and validate a local repository
status: active
priority: high
type: feature
areas:
  - rust
  - frontend
  - platform
created: 2026-07-23
completed:
---

# Goal

Allow the user to select a local folder and determine safely whether it belongs to a valid Git repository or worktree.

# User outcome

A user can open an existing project without using the terminal and receives a clear explanation when the selected folder is not usable.

# Context

This is the first vertical slice connecting the React interface, Tauri command boundary, Rust application layer, system Git, and platform-native folder selection.

The implementation must establish patterns that later repository operations can reuse. Keep Git execution and parsing outside visual components.

# Scope

- Add a native folder-selection flow.
- Validate the selected path in Rust.
- Detect a normal repository and a linked worktree.
- Detect and report the installed Git version as part of diagnostics.
- Return structured repository information to React.
- Display project name, absolute path, worktree type, current branch when available, and a plain-language status message.
- Provide loading, cancellation, invalid-folder, Git-missing, and unexpected-error states.
- Add tests for Rust validation and parsing logic.

# Out of scope

- Cloning repositories.
- Persisting recent projects.
- Full working-tree status or diff parsing.
- Authentication and remote-provider integration.
- Saving versions, fetch, pull, or push.
- Designing the final onboarding experience.

# Acceptance criteria

- [ ] The user can invoke a native folder picker from the existing interface.
- [ ] Cancelling the picker leaves the current state unchanged and is not shown as an error.
- [ ] Validation and Git execution happen in Rust, not in React.
- [ ] Normal repositories and linked worktrees are recognized.
- [ ] A non-repository folder produces a structured, understandable error.
- [ ] Missing or unusable Git produces a structured diagnostic with remediation guidance.
- [ ] React receives typed repository data rather than raw command output.
- [ ] The primary result is explained in plain language, with exact Git details available secondarily.
- [ ] Relevant Rust unit or integration tests use temporary repositories.
- [ ] The required frontend and Rust checks pass.

# Relevant files

- `AGENTS.md`
- `DESIGN.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `work/README.md`
- `src/`
- `src-tauri/src/`

# Dependencies

- System Git is the initial Git implementation strategy.
- A Tauri dialog capability/plugin may be introduced if required; keep permissions minimal and explicit.

# Decisions

- This task should define a structured command/result boundary that later Git features can extend.
- Do not expose raw stderr as the main user-facing message.

# Implementation notes

Not started.

# Validation

Not run yet.
