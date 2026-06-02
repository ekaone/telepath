/**
 * @file index.ts
 * @description Core entry point for @ekaone/telepath
 * @author Eka Prasetia
 * @website https://prasetia.me
 * @license MIT
 */

export { createChannel } from "./channel.js";
export type { Channel } from "./channel.js";
export type { Transport } from "./transport.js";
export type {
  AnyEventMap,
  ChannelOptions,
  EventMap,
  Listener,
  Payload,
  Unsubscribe,
  WildcardListener,
  WireMessage,
} from "./types.js";
