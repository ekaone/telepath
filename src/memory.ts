import type { Transport } from "./transport.js";
import type { WireMessage } from "./types.js";

/**
 * Module-level shared registry — mirrors how BroadcastChannel works across
 * same-origin contexts. All MemoryTransport instances in the same process
 * share this registry so that two createChannel() calls with the same name
 * communicate correctly in tests.
 */
const registry = new Map<string, Set<(message: WireMessage) => void>>();

/**
 * MemoryTransport
 *
 * In-process adapter for test environments and Node.js.
 * All subscribers on the same channel name within the same
 * process receive messages synchronously.
 *
 * No DOM or BroadcastChannel required — drop-in for Vitest.
 *
 * @example
 * const ch = createChannel("app", { transport: "memory" })
 */
export class MemoryTransport implements Transport {
  // track only the callbacks registered by this instance for clean teardown
  private owned = new Map<string, Set<(message: WireMessage) => void>>();

  send(channelName: string, message: WireMessage): void {
    const listeners = registry.get(channelName);
    if (!listeners) return;
    for (const cb of listeners) {
      cb(message);
    }
  }

  subscribe(
    channelName: string,
    cb: (message: WireMessage) => void,
  ): () => void {
    if (!registry.has(channelName)) {
      registry.set(channelName, new Set());
    }
    registry.get(channelName)!.add(cb);

    // track for teardown
    if (!this.owned.has(channelName)) {
      this.owned.set(channelName, new Set());
    }
    this.owned.get(channelName)!.add(cb);

    return () => {
      registry.get(channelName)?.delete(cb);
      this.owned.get(channelName)?.delete(cb);
    };
  }

  close(): void {
    // only remove callbacks this instance registered
    for (const [channelName, cbs] of this.owned) {
      const shared = registry.get(channelName);
      if (shared) {
        for (const cb of cbs) shared.delete(cb);
        if (shared.size === 0) registry.delete(channelName);
      }
    }
    this.owned.clear();
  }
}
