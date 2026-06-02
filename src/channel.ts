import { BroadcastTransport } from "./broadcast.js";
import { MemoryTransport } from "./memory.js";
import type { Transport } from "./transport.js";
import type {
  AnyEventMap,
  ChannelOptions,
  EventMap,
  Listener,
  Unsubscribe,
  WildcardListener,
  WireMessage,
} from "./types.js";
import { isWildcard, matchWildcard } from "./wildcard.js";

// ---------------------------------------------------------------------------
// Channel interface
// ---------------------------------------------------------------------------

export interface Channel<TMap extends EventMap> {
  /**
   * Emit a typed event to all same-origin contexts subscribed to this channel.
   */
  emit<TEvent extends keyof TMap & string>(
    event: TEvent,
    payload: TMap[TEvent],
  ): void;

  /**
   * Subscribe to a specific event or wildcard pattern.
   * Returns an unsubscribe function.
   *
   * @example
   * ch.on("user:logout", (payload) => { ... })
   * ch.on("user:*", (event, payload) => { ... })
   */
  on<TEvent extends keyof TMap & string>(
    event: TEvent,
    listener: Listener<TMap[TEvent]>,
  ): Unsubscribe;
  on(pattern: string, listener: WildcardListener<TMap>): Unsubscribe;

  /**
   * Close the channel and release all resources.
   */
  close(): void;
}

// ---------------------------------------------------------------------------
// Overloads — strict vs flexible
// ---------------------------------------------------------------------------

export function createChannel<TMap extends EventMap>(
  name: string,
  options?: ChannelOptions,
): Channel<TMap>;

export function createChannel(
  name: string,
  options?: ChannelOptions,
): Channel<AnyEventMap>;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function createChannel(
  name: string,
  options: ChannelOptions = {},
): Channel<EventMap> {
  const transport = resolveTransport(options.transport);

  // local listeners: event/pattern → Set of callbacks
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  // subscribe once to the transport for this channel
  const unsub = transport.subscribe(name, (message: WireMessage) => {
    const { event, payload } = message;

    for (const [pattern, cbs] of listeners) {
      if (isWildcard(pattern)) {
        if (matchWildcard(pattern, event)) {
          for (const cb of cbs) cb(event, payload);
        }
      } else {
        if (pattern === event) {
          for (const cb of cbs) cb(payload);
        }
      }
    }
  });

  function emit(event: string, payload: unknown): void {
    const message: WireMessage = {
      channel: name,
      event,
      payload,
      timestamp: Date.now(),
    };
    transport.send(name, message);
  }

  function on(
    pattern: string,
    listener: (...args: unknown[]) => void,
  ): Unsubscribe {
    if (!listeners.has(pattern)) {
      listeners.set(pattern, new Set());
    }
    listeners.get(pattern)!.add(listener);

    return () => {
      listeners.get(pattern)?.delete(listener);
    };
  }

  function close(): void {
    listeners.clear();
    unsub();
    transport.close();
  }

  return { emit, on, close } as unknown as Channel<EventMap>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveTransport(hint: ChannelOptions["transport"]): Transport {
  if (hint === "memory") return new MemoryTransport();
  if (hint === "broadcast") return new BroadcastTransport();

  // auto-detect: use BroadcastChannel if available, else fall back to memory
  if (typeof BroadcastChannel !== "undefined") return new BroadcastTransport();
  return new MemoryTransport();
}
