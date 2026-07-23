---
id: 002
title: Detect and report the installed Git version
status: done
priority: high
type: feature
areas:
  - rust
  - frontend
created: 2026-07-23
completed: 2026-07-23
---

# Goal

Detect whether the system Git executable is available and, if so, which version is installed.

# User outcome

A user (or the user supporting them) can see at a glance whether GitOdrile found a working Git installation, instead of guessing why repository operations fail.

# Context

Split out of `work/done/001-open-local-repository.md`, which originally bundled this in. `work/README.md`'s own task-naming example (`001-open-local-repository.md` / `002-detect-git-version.md`) and `work/backlog.md` (which lists this separately under "Foundation", apart from "Open and validate a local Git repository" under "Repository experience") both treat this as its own task. Keeping repository-opening and Git-diagnostics as separate slices keeps each one small and independently testable.

# Scope

- A Rust command that runs `git --version`, without a shell, and reports whether Git was found and, if so, its version string.
- Reuse the existing Windows `CREATE_NO_WINDOW` handling so no console flashes.
- Surface the result somewhere the user can actually see it — Settings → General, alongside the app version already shown there.
- Handle "Git not found" as a normal, expected outcome (not a crash or unhandled promise rejection).

# Out of scope

- Enforcing a minimum Git version or blocking the app if Git is missing/old.
- Detecting multiple Git installations or letting the user pick one.
- Any other diagnostic beyond the version string (config, credential helper, etc.).

# Acceptance criteria

- [x] A Rust command returns whether Git is installed and its version, without shelling out through `/bin/sh` or `cmd`.
- [x] The frontend calls it and renders the result in Settings.
- [x] A missing Git executable renders as a plain-language "not detected" state, not an error toast or crash.
- [x] Simple tests cover: Git found (parses a real `git --version` on the machine running the tests) and the version-string parsing logic in isolation.
- [x] The required frontend and Rust checks pass.

# Relevant files

- `AGENTS.md`
- `DESIGN.md`
- `src-tauri/src/lib.rs`
- `src/main.tsx`

# Dependencies

- Builds on the `git_command`/process-spawning pattern established in task 001.

# Decisions

- Not blocking: Git-missing is informational only in this task. What (if anything) the app should refuse to do without Git is a later decision.
- Tests are small and use real `git --version` output on the test-running machine rather than mocking the process, per the "simple tests" scope agreed for this pass of work.

# Implementation notes

- `src-tauri/src/lib.rs`: split the old `git_command` into `base_git_command()` (just spawns `git` with the Windows `CREATE_NO_WINDOW` flag) and `git_command(repo_path)` (adds `-C <path>` on top), so `git_diagnostics` can reuse the no-window handling without needing a repository path. Added `git_diagnostics` (returns `{ installed, version }`) and `parse_git_version`, which strips the `git version ` prefix from `git --version`'s output.
- `src/main.tsx`: `App` fetches diagnostics once on mount via `invoke("git_diagnostics")` and passes them to `SettingsPanel`, which renders the version under a new "Git" row in the General section, or a `--status-danger`-colored "Not detected" message if `installed` is false. A failed `invoke` (e.g. running outside Tauri) is treated the same as "not installed" rather than left unhandled.
- Also added 6 Rust tests total (4 carried over/extended from task 001's `open_repository`, 2 new for this task): `git_diagnostics_finds_the_system_git` runs the real command against whatever `git` is on the test machine's PATH (same assumption every other test here already makes), and `parse_git_version_strips_the_leading_label` is a pure string-parsing unit test with no process spawn.

# Validation

- `cargo fmt` — applied, clean.
- `cargo clippy --all-targets --all-features -- -D warnings` — pass, no warnings.
- `cargo test` — 6 passed, 0 failed.
- `npm run typecheck` — pass.
- `npm run build` — pass.
