# @minia2a/elizaos-plugin-minia2a

**The marketplace plugin for ElizaOS agents** — discover, try, and pay for 299+ x402 APIs across crypto, web, AI, and data. USDC on Base.

> Unlike single-vendor x402 plugins that bundle a fixed set of endpoints, this plugin connects your agent to the **entire minia2a.uk marketplace** — 299+ services from dozens of providers, with live discovery, free trials, and transparent pricing.

## Why This Plugin

| Feature | Fixed-Endpoint Plugins | This Plugin |
|---------|----------------------|-------------|
| Services | 8–75 endpoints | **299+ across categories** |
| Discovery | Pre-bundled at build time | **Live marketplace search** |
| Free trials | Sometimes | **15 free calls per endpoint** |
| New services | Wait for plugin update | **Available instantly** |
| Provider diversity | Single vendor | **Dozens of providers** |
| Payment | USDC on chain | **USDC on Base (~3¢ gas)** |

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
      "autoTrial": true,
      "maxPricePerCall": 0.10,
      "baseUrl": "https://minia2a.uk"
    }
  }
}
```

## Actions

| Action | What it does | Example prompt |
|--------|-------------|----------------|
| `SEARCH_APIS` | Search 299+ APIs by keyword or category | "Find APIs that can scrape websites" |
| `CALL_API` | Call any endpoint with auto-trial | "Get the current gas price on Base" |
| `LIST_POPULAR_APIS` | Browse trending services | "What are the most used APIs?" |

## Provider

The `MINIA2A_MARKETPLACE` provider injects live marketplace context into every agent interaction — service counts, popular endpoints, trial availability, and pricing.

## x402 Payment Flow

1. Agent requests endpoint → gets `HTTP 402 Payment Required` with price + wallet
2. Agent auto-signs USDC on Base (if `paymentPrivateKey` configured)
3. Agent retries with `Authorization: x402 <signed-tx>` → receives result
4. Receipt returned in `X-Receipt` header for audit trail

**Without a payment key:** the agent uses free trials — 15 calls per endpoint, zero setup, no wallet.

## Categories

- 🤖 **AI/LLM** — text generation, classification, translation, summarization
- 🔗 **Web** — scraping, search, email verification, DNS, HTTP analysis
- 💰 **Crypto** — gas prices, wallet intel, token security, DEX data, Polymarket
- 🔐 **Security** — CAPTCHA solving, domain intel, SSL checks, OSINT
- 📊 **Data** — enrichment, validation, formatting, CSV/JSON conversion
- 🛠️ **Dev Tools** — code review, regex, UUID, hashing, JWT decode

## Pricing

- **Free trial:** 15 calls per endpoint (`?trial=1`)
- **Paid calls:** Priced per endpoint (typically $0.001–$0.10)
- **Platform fee:** 5% (transparent, no hidden costs)
- **Credits:** 1 USDC = 200 credits, no subscription, no minimum
- **Settlement:** USDC on Base (~3¢ gas, ~2s confirmation)

## Related

- [minia2a.uk](https://minia2a.uk) — The marketplace
- [@minia2a/sdk](https://www.npmjs.com/package/@minia2a/sdk) — CLI for x402 developers
- [x402.org](https://x402.org) — The payment protocol

## License

MIT
