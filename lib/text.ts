export function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function friendlyDbError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security")) {
    return "You do not have permission to change this chronicle.";
  }
  if (lower.includes("foreign key") && lower.includes("profiles")) {
    return "Your profile is not ready yet. Sign out, sign in, and try again.";
  }
  return message;
}

export function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Email or password does not match.";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "An account with that email already exists. Sign in instead.";
  }
  if (
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("network")
  ) {
    return "Could not reach Supabase. Check the project URL and that it is running.";
  }
  if (lower.includes("password")) {
    return message;
  }
  return message;
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
