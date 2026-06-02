import { describe, expect, it, vi } from "vitest";
import { MemoryTransport } from "../src/memory.js";
import type { WireMessage } from "../src/types.js";

function makeMessage(event: string, payload: unknown): WireMessage {
  return { channel: "test", event, payload, timestamp: Date.now() };
}

describe("MemoryTransport", () => {
  it("delivers a message to a subscriber", () => {
    const t = new MemoryTransport();
    const cb = vi.fn();

    t.subscribe("ch", cb);
    t.send("ch", makeMessage("ping", { id: 1 }));

    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ event: "ping" }));
  });

  it("delivers to multiple subscribers on same channel", () => {
    const t = new MemoryTransport();
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    t.subscribe("ch", cb1);
    t.subscribe("ch", cb2);
    t.send("ch", makeMessage("ping", {}));

    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledOnce();
  });

  it("does not deliver to subscribers on a different channel", () => {
    const t = new MemoryTransport();
    const cb = vi.fn();

    t.subscribe("ch-a", cb);
    t.send("ch-b", makeMessage("ping", {}));

    expect(cb).not.toHaveBeenCalled();
  });

  it("unsubscribe stops delivery", () => {
    const t = new MemoryTransport();
    const cb = vi.fn();

    const unsub = t.subscribe("ch", cb);
    unsub();
    t.send("ch", makeMessage("ping", {}));

    expect(cb).not.toHaveBeenCalled();
  });

  it("send to channel with no subscribers does not throw", () => {
    const t = new MemoryTransport();
    expect(() => t.send("ch", makeMessage("ping", {}))).not.toThrow();
  });

  it("close() clears all subscribers", () => {
    const t = new MemoryTransport();
    const cb = vi.fn();

    t.subscribe("ch", cb);
    t.close();
    t.send("ch", makeMessage("ping", {}));

    expect(cb).not.toHaveBeenCalled();
  });

  it("delivers payload correctly", () => {
    const t = new MemoryTransport();
    const cb = vi.fn();

    t.subscribe("ch", cb);
    const msg = makeMessage("update", { items: 42 });
    t.send("ch", msg);

    expect(cb).toHaveBeenCalledWith(msg);
  });
});
