import type { WireMessage } from "./types.js";

/**
 * Transport adapter contract.
 * All adapters must implement this interface.
 *
 * v0.1.0 ships:
 *   - BroadcastTransport  (browser BroadcastChannel)
 *   - MemoryTransport     (in-process, for testing)
 *
 * v0.2.0 planned:
 *   - NodeTransport       (cross-process via IPC)
 */
export interface Transport {
  /**
   * Send a wire message to the given channel name.
   */
  send(channelName: string, message: WireMessage): void;

  /**
   * Subscribe to incoming messages on the given channel name.
   * Returns an unsubscribe function.
   */
  subscribe(
    channelName: string,
    cb: (message: WireMessage) => void,
  ): () => void;

  /**
   * Tear down the transport, releasing all underlying resources.
   */
  close(): void;
}
