/**
 * A map of event names to their payload types.
 * Users define this to get full type safety.
 *
 * @example
 * type AppEvents = {
 *   "user:logout": { reason: string }
 *   "cart:update": { items: number }
 * }
 */
export type EventMap = Record<string, unknown>;

/**
 * Fallback event map when no generic is provided (flexible mode).
 */
export type AnyEventMap = Record<string, unknown>;

/**
 * Extract payload type for a given event key.
 */
export type Payload<
  TMap extends EventMap,
  TEvent extends keyof TMap,
> = TMap[TEvent];

/**
 * Listener callback — typed to the event's payload.
 */
export type Listener<TPayload> = (payload: TPayload) => void;

/**
 * Wildcard listener — receives both event name and payload.
 */
export type WildcardListener<TMap extends EventMap> = (
  event: keyof TMap & string,
  payload: TMap[keyof TMap],
) => void;

/**
 * Unsubscribe function returned by `.on()`.
 */
export type Unsubscribe = () => void;

/**
 * Internal wire format sent over the transport.
 */
export interface WireMessage {
  channel: string;
  event: string;
  payload: unknown;
  timestamp: number;
}

/**
 * Options passed to createChannel().
 */
export interface ChannelOptions {
  /**
   * Transport adapter to use.
   * Defaults to BroadcastTransport in browser, MemoryTransport in test env.
   */
  transport?: "broadcast" | "memory";
}
