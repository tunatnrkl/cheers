"use client";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("pd-tema", next);
    } catch {}
  }
  return (
    <button type="button" onClick={toggle} className="btn size-11 px-0" aria-label="Karanlık / aydınlık tema" title="Tema değiştir">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <path d="M12 3a9 9 0 1 0 9 9c0-.5 0-1-.1-1.4A7 7 0 0 1 12 3z" />
      </svg>
    </button>
  );
}
