# @ekaone/telepath

Typed cross-context message bus for browser environments.

Designed for **horizontal** communication across tabs, windows, iframes, and workers instead of within a single runtime.

```
Tab A  ──telepath──  Tab B
             │
         Web Worker
```

---

## Install

```bash
pnpm add @ekaone/telepath
```

---

## Quick Start

```ts
import { createChannel } from "@ekaone/telepath"

type AppEvents = {
  "user:logout": { reason: string }
  "cart:update": { items: number }
}

const ch = createChannel<AppEvents>("my-app")

// subscribe
ch.on("user:logout", (payload) => {
  console.log("logged out:", payload.reason)
})

// emit — typed, typos caught at compile time
ch.emit("user:logout", { reason: "session-expired" })

// teardown
ch.close()
```

---

## API

### `createChannel<TMap>(name, options?)`

Creates a named channel. All same-origin contexts using the same `name` share the channel.

```ts
// strict — full type safety (recommended)
const ch = createChannel<AppEvents>("my-app")

// flexible — no schema, payload is unknown
const ch = createChannel("my-app")
```

**Options**

| Option      | Type                      | Default      | Description                          |
|-------------|---------------------------|--------------|--------------------------------------|
| `transport` | `"broadcast" \| "memory"` | auto-detect  | Force a specific transport adapter   |

Auto-detection: uses `BroadcastChannel` if available, falls back to in-memory.

---

### `ch.emit(event, payload)`

Broadcast a typed event to all subscribers on this channel across all contexts.

```ts
ch.emit("cart:update", { items: 3 })
```

---

### `ch.on(event, listener)` → `unsubscribe`

Subscribe to a specific event or wildcard pattern. Returns an unsubscribe function.

```ts
// exact match
const unsub = ch.on("cart:update", (payload) => {
  console.log(payload.items)
})

// wildcard — receives event name + payload
ch.on("user:*", (event, payload) => {
  console.log(event, payload)
})

// unsubscribe
unsub()
```

**Wildcard patterns**

| Pattern    | Matches                          |
|------------|----------------------------------|
| `*`        | every event                      |
| `user:*`   | `user:login`, `user:logout`, … |
| `cart:*`   | `cart:update`, `cart:clear`, …  |

---

### `ch.close()`

Tear down the channel and release all underlying resources.

```ts
ch.close()
```

---

## Transports

| Adapter            | When used                                   |
|--------------------|---------------------------------------------|
| `BroadcastTransport` | Browser — crosses tabs, windows, workers  |
| `MemoryTransport`    | No `BroadcastChannel` detected, or forced |

Force a transport explicitly:

```ts
// always in-memory (useful in tests)
const ch = createChannel("app", { transport: "memory" })

// always BroadcastChannel
const ch = createChannel("app", { transport: "broadcast" })
```

---

## Testing with Vitest

No DOM setup needed. Use the `memory` transport:

```ts
import { createChannel } from "@ekaone/telepath"
import { describe, expect, it, vi } from "vitest"

type Events = { "ping": { id: number } }

describe("my feature", () => {
  it("receives events", () => {
    const ch = createChannel<Events>("test", { transport: "memory" })
    const listener = vi.fn()

    ch.on("ping", listener)
    ch.emit("ping", { id: 1 })

    expect(listener).toHaveBeenCalledWith({ id: 1 })
    ch.close()
  })
})
```

---

## Relationship to `@ekaone/hermes`

| Package              | Scope                         | Transport          |
|----------------------|-------------------------------|--------------------|
| `@ekaone/hermes`     | In-process event bus          | In-memory only     |
| `@ekaone/telepath`   | Cross-context message bus     | BroadcastChannel   |

They are composable. A `createBridge(hermes, telepath)` utility is planned for v0.2.0.

---

## Roadmap

**v0.1.0** — `createChannel()`, typed events, wildcards, `BroadcastTransport`, `MemoryTransport`

**v0.2.0** — `createBridge(hermes, telepath)`, leader election, `once()`

**v0.3.0** — Node cross-process adapter, `@ekaone/telepath-devtools`

---

## Requirements

- Node ≥ 18
- Browser with `BroadcastChannel` support (all modern browsers)

## License

MIT © [Eka Prasetia](./LICENSE)

## Links

- [npm Package](https://www.npmjs.com/package/@ekaone/telepath)
- [GitHub Repository](https://github.com/ekaone/telepath)
- [Issue Tracker](https://github.com/ekaone/telepath/issues)

---

⭐ If this library helps you, please consider giving it a star on GitHub!
