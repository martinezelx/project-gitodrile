import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./styles.css";

type ThemePreference = "system" | "light" | "dark";

const THEME_STORAGE_KEY = "gitodrile-theme";

function readStoredTheme(): ThemePreference {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

function applyTheme(theme: ThemePreference): void {
  if (theme === "system") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }
}

const THEME_ICONS: Record<ThemePreference, React.JSX.Element> = {
  system: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  light: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  dark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  ),
};

const THEME_LABELS: Record<ThemePreference, string> = {
  system: "Theme: matching system",
  light: "Theme: light",
  dark: "Theme: dark",
};

const THEME_ORDER: ThemePreference[] = ["system", "light", "dark"];

function ThemeToggle(): React.JSX.Element {
  const [theme, setTheme] = useState<ThemePreference>(() => readStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const cycleTheme = (): void => {
    const nextIndex = (THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length;
    setTheme(THEME_ORDER[nextIndex]);
  };

  return (
    <button
      className="icon-button"
      type="button"
      aria-label={THEME_LABELS[theme]}
      title={THEME_LABELS[theme]}
      onClick={cycleTheme}
    >
      {THEME_ICONS[theme]}
    </button>
  );
}

function App(): React.JSX.Element {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const aboutDialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAboutOpen) {
      return undefined;
    }

    aboutDialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsAboutOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAboutOpen]);

  const appWindow = "__TAURI_INTERNALS__" in window
    ? getCurrentWindow()
    : { minimize: async () => {}, toggleMaximize: async () => {}, close: async () => {} };
  const performWindowAction = (action: () => Promise<void>): void => {
    void action().catch(() => undefined);
  };

  return (
    <div className="app-window">
      <header className="window-titlebar">
        <div
          className="window-titlebar__drag-region"
          data-tauri-drag-region
          onDoubleClick={() => performWindowAction(() => appWindow.toggleMaximize())}
        >
          <div className="window-titlebar__brand" data-tauri-drag-region>
            <span className="window-titlebar__mark" aria-hidden="true">G</span>
            <span data-tauri-drag-region>GitOdrile</span>
          </div>
        </div>
        <div className="window-controls" aria-label="Window controls">
          <button
            className="window-control"
            type="button"
            aria-label="Minimize window"
            onClick={() => performWindowAction(() => appWindow.minimize())}
          >
            <span aria-hidden="true">−</span>
          </button>
          <button
            className="window-control"
            type="button"
            aria-label="Maximize or restore window"
            onClick={() => performWindowAction(() => appWindow.toggleMaximize())}
          >
            <span className="window-control__maximize" aria-hidden="true" />
          </button>
          <button
            className="window-control window-control--close"
            type="button"
            aria-label="Close window"
            onClick={() => performWindowAction(() => appWindow.close())}
          >
            <span className="window-control__close" aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">G</div>
            <div>
              <strong>GitOdrile</strong>
              <span>Git without the bite</span>
            </div>
          </div>

          <nav aria-label="Project navigation">
            <button className="nav-item nav-item--active" type="button">Overview</button>
            <button className="nav-item" type="button">Changes</button>
            <button className="nav-item" type="button">History</button>
            <button className="nav-item" type="button">Recovery</button>
          </nav>
        </aside>

        <section className="workspace">
          <header className="topbar">
            <div>
              <p className="eyebrow">Welcome to</p>
              <h1>GitOdrile</h1>
            </div>
            <div className="topbar-actions">
              <ThemeToggle />
              <button className="secondary-button" type="button" onClick={() => setIsAboutOpen(true)}>
                About
              </button>
            </div>
          </header>

          <section className="hero-card">
            <div>
              <p className="eyebrow">No project open</p>
              <h2>Version control that speaks your language.</h2>
              <p>
                Open a Git project to review changes, save safe versions, publish work,
                and recover from mistakes without memorising commands.
              </p>
            </div>
            <div className="actions">
              <button className="primary-button" type="button">Open a project</button>
              <button className="secondary-button" type="button">Clone from GitHub</button>
            </div>
          </section>

          <section className="principles" aria-label="Product principles">
            <article>
              <span>01</span>
              <h3>Clear</h3>
              <p>Actions describe outcomes instead of exposing jargon first.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Safe</h3>
              <p>Risky operations include previews and a recovery path.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Fast</h3>
              <p>A lightweight Tauri shell with Rust handling native work.</p>
            </article>
          </section>
        </section>
      </main>

      {isAboutOpen && (
        <div className="about-backdrop" role="presentation" onMouseDown={() => setIsAboutOpen(false)}>
          <div
            ref={aboutDialogRef}
            className="about-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="about-dialog__mark" aria-hidden="true">G</div>
            <p className="eyebrow">About GitOdrile</p>
            <h2 id="about-title">Git without the bite.</h2>
            <p>
              GitOdrile is a friendly desktop Git client that turns version control
              into clear, safe steps.
            </p>
            <dl className="about-details">
              <div><dt>Version</dt><dd>0.1.0</dd></div>
              <div><dt>Built with</dt><dd>Tauri, React, and Rust</dd></div>
            </dl>
            <button className="primary-button" type="button" onClick={() => setIsAboutOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
