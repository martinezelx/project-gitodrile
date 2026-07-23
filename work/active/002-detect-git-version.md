---
id: 002
title: Detect and report the installed Git version
status: active
priority: high
type: feature
areas:
  - rust
  - frontend
created: 2026-07-23
completed:
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
- **Reopened, now implemented:** when Git isn't detected, an "Install Git" button triggers a native install path (see Decisions and Implementation notes) instead of leaving the user to find the download themselves. Still needs the user to verify against a real machine without Git before this is marked done (see the unchecked criterion below).
- **Reopened again:** when Git *is* installed, check whether a newer version is available (via `winget upgrade`) and show an "Update" button next to the version, mirroring the install flow.

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
- [ ] When Git isn't detected, the user has a way to install it that doesn't require them to manually find the download page themselves — built, not yet verified on a real machine that's actually missing Git (see Validation). This is what keeps this task `active` rather than `done`.
- [x] When Git is installed and a newer version is available, the user sees that and can trigger an update the same way — verified by the user on a real machine with an outdated Git: clicking "Update" launched the Git-for-Windows installer via winget (took a moment to appear, not instant).

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
- **Install path (decided with user):** OS package manager first, browser as fallback — not bundling the actual installer (too heavy, needs updating, and macOS/Linux would each need a completely different mechanism anyway). On Windows: `winget install --id Git.Git -e --accept-package-agreements --accept-source-agreements`, spawned (not awaited) so the app doesn't block on the install; if `winget` itself can't be spawned, fall back to opening `https://git-scm.com/downloads` in the browser via `tauri-plugin-opener`. macOS/Linux always fall back to the browser for now — no package-manager integration for those platforms yet (out of scope, follow-up if needed).
- Not testing `install_git` itself: it has a real side effect (launching a software installer), so calling it from an automated test would actually trigger a Git installation on whatever machine runs `cargo test` — unacceptable. This is why it's excluded from the "simple tests" set unlike `open_repository`/`git_diagnostics`, which are read-only.
- Update detection uses `winget upgrade` (list all upgradable packages, no `--id` filter) and checks whether `"Git.Git"` appears in the output, rather than parsing winget's column-based table for exact version numbers — winget's table formatting isn't a stable, documented contract, and a substring check is far more tolerant of winget version/locale differences while still answering the only question that matters here ("is there an update for Git"). `update_git` reuses the same `spawn_winget` helper as `install_git` (just `upgrade` instead of `install`), same reasoning for not unit-testing it (real side effect) or `check_git_update` (network-dependent, since winget hits its remote source — not something a hermetic test should require).

# Implementation notes

- `src-tauri/src/lib.rs`: split the old `git_command` into `base_git_command()` (just spawns `git` with the Windows `CREATE_NO_WINDOW` flag) and `git_command(repo_path)` (adds `-C <path>` on top), so `git_diagnostics` can reuse the no-window handling without needing a repository path. Added `git_diagnostics` (returns `{ installed, version }`) and `parse_git_version`, which strips the `git version ` prefix from `git --version`'s output.
- `src/main.tsx`: `App` fetches diagnostics once on mount via `invoke("git_diagnostics")` and passes them to `SettingsPanel`, which renders the version under a new "Git" row in the General section, or a `--status-danger`-colored "Not detected" message if `installed` is false. A failed `invoke` (e.g. running outside Tauri) is treated the same as "not installed" rather than left unhandled.
- Also added 6 Rust tests total (4 carried over/extended from task 001's `open_repository`, 2 new for this task): `git_diagnostics_finds_the_system_git` runs the real command against whatever `git` is on the test machine's PATH (same assumption every other test here already makes), and `parse_git_version_strips_the_leading_label` is a pure string-parsing unit test with no process spawn.
- Added `tauri-plugin-opener` (crate + `@tauri-apps/plugin-opener`, capability `opener:allow-open-url`) and `install_git()`/`update_git()` (both built on a shared `spawn_winget` helper), returning `{ started, fallbackUrl }`. `src/main.tsx`'s Settings "Git" row grows an "Install Git" button when not installed, or an "Update" button plus an "Update available" badge next to the version when `check_git_update` finds one; both buttons share one `runWingetAction` handler and one status-message line ("Installer/Update launched…" or "Opened the official download page…").
- `check_git_update` (Rust) runs on Windows only for now; `src/main.tsx` fires it once, right after `git_diagnostics` resolves with `installed: true` (a second effect keyed on `gitDiagnostics?.installed`) rather than on every Settings visit, since it shells out to `winget upgrade` each time.
- On first real-machine test, clicking "Update" appeared to do nothing at first. Root cause turned out to be two separate (real, worth fixing regardless) issues rather than the update flow being broken: (1) `src-tauri/src/main.rs` had no `windows_subsystem` attribute, so GitOdrile itself runs with a console subsystem — meaning a spawned child with no explicit console flag inherits/shares that console instead of reliably popping its own window; fixed by hiding the app's own console in release builds only (`#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]`) and, more importantly, (2) `spawn_winget` now passes `CREATE_NEW_CONSOLE` explicitly so winget always gets its own visible window regardless of the parent's console state. In the end the installer *did* appear on the user's machine, just after a real delay — `winget` can take a noticeable moment to launch — so the status messages were also reworded to set that expectation ("this can take a moment to appear").

# Validation

- `cargo fmt` — applied, clean.
- `cargo clippy --all-targets --all-features -- -D warnings` — pass, no warnings.
- `cargo test` — 6 passed, 0 failed (unchanged by this addition — none of `install_git`/`update_git`/`check_git_update` are unit tested, see Decisions).
- `npm run typecheck` — pass.
- `npm run build` — pass.
- User confirmed on a real machine: Git was outdated, "Update available" badge showed, clicking "Update" launched the real Git-for-Windows installer via winget (after a noticeable delay, not instant).
- **Still not done:** verifying the "Install Git" path on a machine that's actually missing Git — that's the one remaining unchecked criterion above.
