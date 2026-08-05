# @minia2a/elizaos-plugin-minia2a

**ElizaOS plugin for [minia2a.uk](https://minia2a.uk)** — discover and call 299+ x402 pay-per-call APIs directly from your AI agent.

## What This Plugin Does

Your ElizaOS agent gets 3 new abilities:

| Action | What it does |
|--------|-------------|
| `SEARCH_APIS` | Search 299+ APIs by keyword or category |
| `CALL_API` | Call any endpoint with auto-trial (15 free calls per API) |
| `LIST_POPULAR_APIS` | Browse trending/most-used services |

Plus a provider that injects live marketplace stats into the agent's context.

## Install

```bash
npm install @minia2a/elizaos-plugin-minia2a
```

## Configure

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

## Usage

Once configured, your agent can:

**Search for APIs:**
> "Search for APIs that can scrape websites"

**Browse the marketplace:**
> "What APIs are available?"

**Call an endpoint:**
> "Call the /x402/gas endpoint" or "Try the gas price API"

## x402 Payment Flow

This plugin handles the full x402 flow:

1. Agent requests an endpoint → gets **HTTP 402 Payment Required** with price + wallet address
2. Agent auto-signs USDC on Base (if `paymentPrivateKey` configured)
3. Agent retries with payment proof → receives result

Without a payment key configured, the agent uses **free trials** (15 calls per endpoint).

## Real Data

minia2a.uk currently has **299 services** with **8,144+ trials** from **318 developers** across categories including:

- 🤖 AI/LLM (text generation, classification, translation)
- 🔗 Web (scraping, search, email verification)
- 💰 Crypto (gas, prices, wallet intel, token security)
- 🔐 Security (CAPTCHA solving, domain intel, audits)
- 📊 Data (enrichment, validation, formatting)

## License

MIT
