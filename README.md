# @minia2a/elizaos-plugin-minia2a

**The marketplace plugin for ElizaOS agents** — discover and call 1,680+ x402 APIs across crypto, web, AI, and data, with live pricing surfaced on every HTTP 402. USDC on Base.

> Unlike single-vendor x402 plugins that bundle a fixed set of endpoints, this plugin connects your agent to the **entire minia2a.uk marketplace** — 1,680+ services from dozens of providers, with live discovery and transparent pricing.

> **Scope of this version:** it does not sign trials and does not settle payments. `CALL_API` returns the endpoint's response, or on 402 reports the price plus the exact signed-trial recipe for your agent to follow. Neither the trial message nor a USDC payment is signed for you.

## Why This Plugin

| Feature | Fixed-Endpoint Plugins | This Plugin |
|---------|----------------------|-------------|
| Services | 8–75 endpoints | **1,680+ across categories** |
| Discovery | Pre-bundled at build time | **Live marketplace search** |
| Free trials | Sometimes | **5 free trial calls per signed wallet** (platform-side; sign the message yourself) |
| New services | Wait for plugin update | **Available instantly** |
| Provider diversity | Single vendor | **Dozens of providers** |
| Payment | USDC on chain | **x402 / USDC on Base** (not settled by this version) |

## Install

```bash
npm install @minia2a/elizaos-plugin-minia2a
```

## Quick Start

Add to your agent's `character.json`:

```json
{
  "plugins": ["@minia2a/elizaos-plugin-minia2a"],
  "settings": {
    "MINIA2A_CONFIG": {
      "baseUrl": "https://minia2a.uk",
      "maxSpendPerSession": 500
    }
  }
}
```

## Actions

| Action | What it does | Example prompt |
|--------|-------------|----------------|
| `SEARCH_APIS` | Search 1,680+ APIs by keyword or category | "Find APIs that can scrape websites" |
| `CALL_API` | Call any endpoint; on 402 return its price + the signed-trial recipe | "Get the current gas price on Base" |
| `LIST_POPULAR_APIS` | Browse trending services | "What are the most used APIs?" |

## Provider

The `MINIA2A_MARKETPLACE` provider injects live marketplace context into every agent interaction — service counts, popular endpoints, trial availability, and pricing.

## What happens on HTTP 402

1. Agent calls an endpoint → the gateway answers `402 Payment Required`.
2. The challenge is in the **`payment-required` response header** (base64 JSON with an
   `accepts[]` array). `CALL_API` decodes it and reports the price, e.g. `0.5 USDC on eip155:8453`.
3. The agent then either **pays via x402 itself** (`PAYMENT-SIGNATURE` V2 / `X-PAYMENT` V1)
   or **draws a free trial** with a signed wallet — see below.
4. A successful call carries a receipt in the **`x-minia2a-receipt`** header, which `CALL_API`
   surfaces in its reply.

This plugin performs steps 1–2 and 4. It does **not** perform step 3: no trial signature and no
payment is produced for you. `paymentPrivateKey` is accepted by the config but has no signer
behind it, so setting it changes nothing.

### Free trials (5 per signed wallet, no registration)

Trials are wallet-based, not a URL parameter. A bare `?trial=1` draws nothing — the gateway
documents that explicitly in its [AGENTS.md](https://minia2a.uk/AGENTS.md). To draw one:

```
message = "minia2a trial:" + wallet + ":" + serviceId + ":" + unixSeconds    # EIP-191
GET /x402/<svc>?wallet=<wallet>
  X-Wallet-Signature: <signature>
  X-Trial-Timestamp: <unixSeconds>
# → 200 + x-trial-remaining: 4, x-trial-max: 5
```

`serviceId` is the catalog `id` (e.g. `x402-gas`), **not** the URL path segment (`gas`).

## Categories

- 🤖 **AI/LLM** — text generation, classification, translation, summarization
- 🔗 **Web** — scraping, search, email verification, DNS, HTTP analysis
- 💰 **Crypto** — gas prices, wallet intel, token security, DEX data, Polymarket
- 🔐 **Security** — CAPTCHA solving, domain intel, SSL checks, OSINT
- 📊 **Data** — enrichment, validation, formatting, CSV/JSON conversion
- 🛠️ **Dev Tools** — code review, regex, UUID, hashing, JWT decode

## Pricing

- **Free trial:** 5 calls per signed wallet, one allowance across the whole catalog — see above
- **Paid calls:** Priced per endpoint (typically $0.001–$0.10), charged in USDC per call
- **Platform fee:** 5% (transparent, no hidden costs)
- **No credits, no subscription, no minimum** — the platform's unit is USDC (microUSDC balances)
- **Settlement:** USDC on Base (~3¢ gas, ~2s confirmation)

## Related

- [minia2a.uk](https://minia2a.uk) — The marketplace
- [@minia2a/sdk](https://www.npmjs.com/package/@minia2a/sdk) — CLI for x402 developers
- [x402.org](https://x402.org) — The payment protocol

## License

MIT
