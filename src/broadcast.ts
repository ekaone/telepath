import type { Transport } from "./transport.js";
import type { WireMessage } from "./types.js";

/**
 * BroadcastTransport
 *
 * Browser-native adapter using the BroadcastChannel API.
 * Messages are delivered to all same-origin contexts:
 * tabs, windows, iframes, and workers.
 *
 * One BroadcastChannel instance is created per channel name
 * and reused for both send and subscribe.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel
 */
export class BroadcastTransport implements Transport {
  private channels = new Map<string, BroadcastChannel>();

  private getOrCreate(channelName: string): BroadcastChannel {
    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, new BroadcastChannel(channelName));
    }
    return this.channels.get(channelName)!;
  }

  send(channelName: string, message: WireMessage): void {
    const bc = this.getOrCreate(channelName);
    bc.postMessage(message);
  }

  subscribe(
    channelName: string,
    cb: (message: WireMessage) => void,
  ): () => void {
    const bc = this.getOrCreate(channelName);

    const handler = (event: MessageEvent<WireMessage>) => {
      cb(event.data);
    };

    bc.addEventListener("message", handler);

    return () => {
      bc.removeEventListener("message", handler);
    };
  }

  close(): void {
    for (const bc of this.channels.values()) {
      bc.close();
    }
    this.channels.clear();
  }
}
