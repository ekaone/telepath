import { describe, expect, it } from "vitest";
import { isWildcard, matchWildcard } from "../src/wildcard.js";

describe("matchWildcard", () => {
  it("matches exact event name", () => {
    expect(matchWildcard("user:logout", "user:logout")).toBe(true);
  });

  it("does not match different exact event", () => {
    expect(matchWildcard("user:logout", "user:login")).toBe(false);
  });

  it("* matches any event", () => {
    expect(matchWildcard("*", "user:logout")).toBe(true);
    expect(matchWildcard("*", "cart:update")).toBe(true);
    expect(matchWildcard("*", "anything")).toBe(true);
  });

  it("namespace:* matches events in that namespace", () => {
    expect(matchWildcard("user:*", "user:logout")).toBe(true);
    expect(matchWildcard("user:*", "user:login")).toBe(true);
    expect(matchWildcard("user:*", "user:profile:update")).toBe(true);
  });

  it("namespace:* does not match other namespaces", () => {
    expect(matchWildcard("user:*", "cart:update")).toBe(false);
    expect(matchWildcard("cart:*", "user:logout")).toBe(false);
  });

  it("does not match partial prefix without wildcard", () => {
    expect(matchWildcard("user", "user:logout")).toBe(false);
  });

  it("handles empty string event", () => {
    expect(matchWildcard("*", "")).toBe(true);
    expect(matchWildcard("user:*", "")).toBe(false);
  });
});

describe("isWildcard", () => {
  it("returns true for patterns with *", () => {
    expect(isWildcard("*")).toBe(true);
    expect(isWildcard("user:*")).toBe(true);
    expect(isWildcard("cart:*")).toBe(true);
  });

  it("returns false for exact patterns", () => {
    expect(isWildcard("user:logout")).toBe(false);
    expect(isWildcard("cart:update")).toBe(false);
    expect(isWildcard("")).toBe(false);
  });
});
