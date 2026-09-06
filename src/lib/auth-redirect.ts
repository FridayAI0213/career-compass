const KEY = "jobos:auth-redirect";

/** Only same-origin absolute paths are ever accepted as a destination. */
export function safePath(value: string | null | undefined): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export function rememberRedirect(path: string | undefined) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, safePath(path));
  } catch {
    /* storage unavailable — fall back to the default destination */
  }
}

export function consumeRedirect(): string {
  if (typeof window === "undefined") return "/dashboard";
  try {
    const stored = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    return safePath(stored);
  } catch {
    return "/dashboard";
  }
}

/** OAuth providers can report failures through query or hash params. */
export function readOAuthError(): string | null {
  if (typeof window === "undefined") return null;
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const description = query.get("error_description") ?? hash.get("error_description");
  const code = query.get("error") ?? hash.get("error");
  if (!description && !code) return null;
  return description ?? `Sign-in failed (${code}).`;
}
