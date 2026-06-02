/**
 * Wildcard pattern matching for event names.
 *
 * Supports a single `*` glob at the end of a namespace segment.
 *
 * @example
 * matchWildcard("user:*", "user:logout")  // true
 * matchWildcard("user:*", "user:login")   // true
 * matchWildcard("user:*", "cart:update")  // false
 * matchWildcard("*",      "anything")     // true
 */
export function matchWildcard(pattern: string, event: string): boolean {
  if (pattern === "*") return true;
  if (pattern === event) return true;

  if (!pattern.includes("*")) return false;

  // Only support trailing wildcard: "namespace:*"
  const prefix = pattern.slice(0, pattern.indexOf("*"));
  return event.startsWith(prefix);
}

/**
 * Returns true if the given pattern string contains a wildcard.
 */
export function isWildcard(pattern: string): boolean {
  return pattern.includes("*");
}
