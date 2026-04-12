type NameSource = {
  name?: string | null;
  email?: string | null;
};

function clean(value: string | null | undefined): string {
  return (value || "").trim();
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function isEmailLike(value: string | null | undefined): boolean {
  const v = clean(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function usernameFromEmail(email: string | null | undefined): string {
  const e = clean(email).toLowerCase();
  if (!e.includes("@")) return "member";
  return e.split("@")[0] || "member";
}

export function displayNameFromEmail(email: string | null | undefined): string {
  const username = usernameFromEmail(email)
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!username) return "Member";
  return titleCase(username);
}

export function getUserDisplayName(source: NameSource): string {
  const n = clean(source.name);
  if (n && !isEmailLike(n)) return n;

  const e = clean(source.email);
  if (e) return displayNameFromEmail(e);

  return "Member";
}

export function getUserHandle(source: NameSource): string {
  const e = clean(source.email);
  if (e) return usernameFromEmail(e);

  const n = getUserDisplayName(source)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, ".");

  return n || "member";
}

export function getUserInitials(source: NameSource): string {
  const displayName = getUserDisplayName(source);
  const tokens = displayName.split(/\s+/).filter(Boolean);
  if (!tokens.length) return "M";

  const first = tokens[0]?.charAt(0) || "";
  const second = tokens.length > 1 ? tokens[tokens.length - 1].charAt(0) : "";
  const initials = `${first}${second}`.toUpperCase();

  return initials || "M";
}