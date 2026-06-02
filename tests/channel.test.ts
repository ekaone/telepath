import { describe, expect, it, vi } from "vitest";
import { createChannel } from "../src/channel.js";

type AppEvents = {
  "user:logout": { reason: string };
  "user:login": { userId: string };
  "cart:update": { items: number };
  ping: { id: number };
};

const opts = { transport: "memory" } as const;

describe("createChannel — strict mode", () => {
  it("emits and receives a typed event", () => {
    const ch = createChannel<AppEvents>("app", opts);
    const cb = vi.fn();

    ch.on("user:logout", cb);
    ch.emit("user:logout", { reason: "session-expired" });

    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith({ reason: "session-expired" });
    ch.close();
  });

  it("does not deliver to listeners on a different event", () => {
    const ch = createChannel<AppEvents>("app", opts);
    const cb = vi.fn();

    ch.on("cart:update", cb);
    ch.emit("user:logout", { reason: "expired" });

    expect(cb).not.toHaveBeenCalled();
    ch.close();
  });

  it("delivers to multiple listeners on same event", () => {
    const ch = createChannel<AppEvents>("app", opts);
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    ch.on("ping", cb1);
    ch.on("ping", cb2);
    ch.emit("ping", { id: 1 });

    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledOnce();
    ch.close();
  });

  it("unsubscribe stops delivery", () => {
    const ch = createChannel<AppEvents>("app", opts);
    const cb = vi.fn();

    const unsub = ch.on("ping", cb);
    unsub();
    ch.emit("ping", { id: 1 });

    expect(cb).not.toHaveBeenCalled();
    ch.close();
  });

  it("multiple emits all delivered", () => {
    const ch = createChannel<AppEvents>("app", opts);
    const cb = vi.fn();

    ch.on("ping", cb);
    ch.emit("ping", { id: 1 });
    ch.emit("ping", { id: 2 });
    ch.emit("ping", { id: 3 });

    expect(cb).toHaveBeenCalledTimes(3);
    ch.close();
  });

  it("close() stops all delivery", () => {
    const ch = createChannel<AppEvents>("app", opts);
    const cb = vi.fn();

    ch.on("ping", cb);
    ch.close();
    ch.emit("ping", { id: 1 });

    expect(cb).not.toHaveBeenCalled();
  });
});

describe("createChannel — wildcard", () => {
  it("* pattern matches all events", () => {
    const ch = createChannel<AppEvents>("app", opts);
    const cb = vi.fn();

    ch.on("*", cb);
    ch.emit("ping", { id: 1 });
    ch.emit("cart:update", { items: 5 });

    expect(cb).toHaveBeenCalledTimes(2);
    ch.close();
  });

  it("namespace:* matches events in that namespace", () => {
    const ch = createChannel<AppEvents>("app", opts);
    const cb = vi.fn();

    ch.on("user:*", cb);
    ch.emit("user:logout", { reason: "expired" });
    ch.emit("user:login", { userId: "abc" });
    ch.emit("cart:update", { items: 1 });

    expect(cb).toHaveBeenCalledTimes(2);
    ch.close();
  });

  it("wildcard listener receives event name and payload", () => {
    const ch = createChannel<AppEvents>("app", opts);
    const cb = vi.fn();

    ch.on("user:*", cb);
    ch.emit("user:logout", { reason: "expired" });

    expect(cb).toHaveBeenCalledWith("user:logout", { reason: "expired" });
    ch.close();
  });

  it("wildcard unsubscribe works", () => {
    const ch = createChannel<AppEvents>("app", opts);
    const cb = vi.fn();

    const unsub = ch.on("user:*", cb);
    unsub();
    ch.emit("user:logout", { reason: "expired" });

    expect(cb).not.toHaveBeenCalled();
    ch.close();
  });
});

describe("createChannel — flexible mode", () => {
  it("accepts any event name and payload", () => {
    const ch = createChannel("app", opts);
    const cb = vi.fn();

    ch.on("whatever", cb);
    ch.emit("whatever", { foo: "bar" });

    expect(cb).toHaveBeenCalledWith({ foo: "bar" });
    ch.close();
  });
});

describe("createChannel — two channels same name", () => {
  it("two channel instances on same name communicate", () => {
    const sender = createChannel<AppEvents>("shared", opts);
    const receiver = createChannel<AppEvents>("shared", opts);
    const cb = vi.fn();

    receiver.on("ping", cb);
    sender.emit("ping", { id: 99 });

    expect(cb).toHaveBeenCalledWith({ id: 99 });
    sender.close();
    receiver.close();
  });

  it("channels with different names are isolated", () => {
    const chA = createChannel<AppEvents>("channel-a", opts);
    const chB = createChannel<AppEvents>("channel-b", opts);
    const cb = vi.fn();

    chB.on("ping", cb);
    chA.emit("ping", { id: 1 });

    expect(cb).not.toHaveBeenCalled();
    chA.close();
    chB.close();
  });
});
