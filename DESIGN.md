# GitOdrile Design Direction

## Design goal

GitOdrile should make a complex technical system feel calm, understandable, and safe. The interface must be modern and distinctive without sacrificing readability or looking like a decorative concept app.

The intended feeling is:

- friendly but professional;
- lightweight but capable;
- contemporary but durable;
- reassuring rather than intimidating.

## Visual character

The visual language may use:

- medium-to-large rounded corners;
- layered panels;
- restrained translucency and background blur;
- thin, low-contrast borders;
- soft elevation;
- generous spacing around primary actions;
- compact spacing in file lists and diffs;
- a crocodile mascot used selectively.

Avoid excessive glassmorphism. Code, diffs, file lists, conflict editors, forms, and long-form content must sit on mostly opaque surfaces.

## Layout concept

The main desktop window should broadly support:

1. **Top bar**
   - current project;
   - global search / command palette;
   - sync state;
   - settings and account entry points.

2. **Navigation rail or sidebar**
   - Overview;
   - Changes;
   - History;
   - Workspaces/branches;
   - Recovery;
   - optional advanced Git tools.

3. **Primary workspace**
   - task-focused content;
   - clear empty states;
   - contextual primary action;
   - secondary technical details on demand.

4. **Optional inspector**
   - metadata;
   - exact Git details;
   - file or commit information.

The app should work well between approximately 1024px and large desktop displays. Do not assume a maximized window.

## Design tokens

Initial tokens are intentionally provisional.

```css
:root {
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 22px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;

  --duration-fast: 120ms;
  --duration-normal: 180ms;
}
```

Colors should be defined semantically rather than by component:

- `--surface-app`
- `--surface-panel`
- `--surface-raised`
- `--surface-code`
- `--text-primary`
- `--text-secondary`
- `--border-subtle`
- `--accent-primary`
- `--status-success`
- `--status-warning`
- `--status-danger`
- `--diff-added`
- `--diff-removed`

Do not hard-code product colors throughout components.

## Brand and mascot

Working brand: **GitOdrile**.

Mascot: a stylized crocodile that feels clever, calm, and trustworthy.

Potential visual traits:

- rounded geometric silhouette;
- simple eye and one or two restrained teeth;
- confident, neutral expression;
- recognizable at 16–32px;
- adaptable to monochrome tray/taskbar contexts;
- not overly detailed or child-oriented.

The mascot may appear in:

- application icon;
- onboarding;
- empty states;
- success and recovery moments;
- documentation and marketing.

Do not place the mascot in every panel or use it to trivialize serious errors.

## Typography

Use the system UI font stack initially for native feel and low bundle cost. A branded typeface can be evaluated later.

Requirements:

- clear distinction between headings, labels, body copy, and metadata;
- monospaced text for paths, refs, hashes, commands, and diffs;
- readable line heights;
- no tiny low-contrast secondary text;
- avoid all-caps labels except very short status tags.

## Motion

Motion should communicate relationships and state changes, not decorate.

Good uses:

- panel transitions;
- file selection;
- expanding technical details;
- successful save/publish feedback;
- progress between safe-operation steps.

Rules:

- keep most transitions between 120–220ms;
- avoid large spring animations in work surfaces;
- respect `prefers-reduced-motion`;
- never delay an operation solely to show an animation.

## Transparency and native effects

Cross-platform CSS translucency may be used in the top bar, sidebar, menus, command palette, and dialogs.

Native window effects such as Windows Mica/Acrylic and macOS vibrancy are optional enhancements. The app must look complete without them because behavior varies by OS, compositor, and webview.

Linux should receive a deliberate solid-surface fallback.

## Accessibility

Minimum expectations:

- full keyboard navigation for primary workflows;
- visible focus states;
- WCAG AA text contrast where practical;
- do not communicate file state only through color;
- scalable text and layouts;
- screen-reader labels for icon-only controls;
- reduced-motion support;
- minimum comfortable pointer target sizes.

Keyboard shortcuts must use platform conventions:

- `Ctrl` on Windows/Linux;
- `Cmd` on macOS.

## Content design

The interface should explain Git in plain language while preserving technical truth.

Good:

> You have 3 saved versions that have not been published yet.

Less suitable as the default:

> Your branch is 3 commits ahead of origin/main.

Advanced details may display both.

Action labels should describe outcomes:

- Save version
- Publish changes
- Get team changes
- Set changes aside
- Restore this version
- Create separate workspace

Avoid vague labels such as “Continue” when a more precise action fits.

## Core screens for the first design pass

1. Welcome / open project.
2. Repository overview.
3. Changed files and diff viewer.
4. Save-version flow.
5. Sync/publish flow.
6. History timeline.
7. Recovery center.
8. Conflict resolution.
9. Settings and Git diagnostics.

Each screen must define loading, empty, success, warning, and error states.
