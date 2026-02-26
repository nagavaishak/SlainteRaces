# 🏇 Sláinte Races — Resurrecting Onchain Horse Racing

> Crypto horse racing is dead. Zed Run collapsed. Photo Finish faded. NFT horses are buried.
> But real horse racing is a **€30 billion global industry**. Ireland bets €4B annually.
> We brought it back — with Ephemeral Rollups, Blinks, and predictive ticketing.

**Live Demo:** https://slainteraces.vercel.app · **Solana Devnet**

**Video Walkthrough:** [3-min demo — link coming soon]

---

## 🎯 What Is This?

**Sláinte Races** is a parimutuel prediction market for real Irish horse races, built on Solana. Users trade YES/NO shares on race outcomes using SOL — winners split the losing pool after a 2.5% fee. No bookmaker, no custody, no KYC.

### Why Horse Racing?

- Centralized bookmakers extract **15–20%** from a €30B global industry
- The €4B Irish market has **zero** crypto-native alternatives
- In-play betting (bets placed as races unfold) needs **sub-50ms latency** — impossible on base Solana, perfect for Ephemeral Rollups
- 1.5M Irish diaspora worldwide — Blinks bring the market to them without app downloads

---

## ⚡ MagicBlock Ephemeral Rollup Integration

The killer feature: **live in-play betting at 10ms latency** during races.

### How It Works

```
Normal (upcoming races):
  User → PlaceBet tx → Solana Devnet → confirmed in ~400ms

Live race (in-play):
  Admin: start_live_betting() → race vault PDA delegates to ER
  User  → PlaceBet tx → MagicBlock ER endpoint → confirmed in ~10ms, zero fees
  Admin: end_live_betting()  → state commits back to Solana mainnet
  Settlement proceeds on mainnet as normal
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    SLÁINTE RACES                        │
│                                                         │
│  Race: "Will Fastnet Rock win at Leopardstown?"         │
│                                                         │
│  Upcoming          Live              Settled            │
│  ─────────         ────────          ─────────          │
│  400ms bets        10ms bets         ClaimWinnings      │
│  Solana RPC        MagicBlock ER     Solana RPC         │
│                    endpoint                             │
│                         │                              │
│              ┌──────────▼──────────┐                   │
│              │  Race Vault PDA     │                   │
│              │  [delegated to ER]  │                   │
│              │  auto-commit: 30s   │                   │
│              └──────────┬──────────┘                   │
│                         │                              │
│                 commit_and_undelegate                   │
│                         │                              │
│              ┌──────────▼──────────┐                   │
│              │  Solana Mainnet     │                   │
│              │  (settlement)       │                   │
│              └─────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### Implementation

**Program Instructions:**

| Instruction | Description |
|---|---|
| `start_live_betting` | Delegates race vault PDA to MagicBlock ER via `delegate_account` CPI |
| `end_live_betting` | Commits accumulated ER state back to mainnet via `commit_and_undelegate_accounts` |
| `place_bet` | Unchanged — routes to ER endpoint when race is live |

**Frontend Dual RPC (`src/lib/connections.ts`):**

```typescript
// Standard Solana Devnet (~400ms)
export const baseConnection = new Connection("https://api.devnet.solana.com");

// MagicBlock ER endpoint (~10ms, zero fees)
export const erConnection = new Connection("https://devnet.magicblock.app/", {
  wsEndpoint: "wss://devnet.magicblock.app/"
});

// Route bets based on race status
export function getConnectionForRace(isLive: boolean): Connection {
  return isLive ? erConnection : baseConnection;
}
```

**UI:** Live races display an `⚡ ER` badge and the bet modal shows "MagicBlock Ephemeral Rollup · ~10ms" routing indicator.

---

## 🔗 Solana Blinks

Any race market is shareable as a Blink — users bet without leaving their platform.

**Blink URL format:**
```
https://dial.to/?action=solana-action:https://slainteraces.vercel.app/api/actions/blink/<slug>
```

**Example — Fastnet Rock:**
```
https://dial.to/?action=solana-action:https://slainteraces.vercel.app/api/actions/blink/fastnet-rock
```

**What the Blink shows:**
- Race question + current YES/NO probabilities in cents (e.g. "YES 73¢")
- Amount input field
- Builds an unsigned `PlaceBet` transaction returned as base64
- Works on X/Twitter, Discord, Telegram, any Blinks-compatible wallet

**Actions API (`/api/actions/blink/[raceId].ts`):**
- `GET` → Solana Action metadata (spec `type: "action"`, icon, title, buttons)
- `POST` → Builds unsigned PlaceBet tx, returns `{ transaction: "<base64>" }`
- `CORS: *` · `X-Blockchain-Ids: solana:5eykt...` · `X-Action-Version: 2.1.3`

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Smart Contract** | Anchor (Rust) on Solana Devnet — `BPUdzBSLs2MptKdJZ68hkyMAVdWsotYWLCcSfrQ4AurG` |
| **ER Integration** | MagicBlock `ephemeral-rollups-sdk v0.2` |
| **Frontend** | React + TypeScript + Vite + Tailwind CSS |
| **Backend** | Supabase (Postgres + Realtime subscriptions) |
| **Wallets** | Phantom, Solflare via `@solana/wallet-adapter` |
| **Distribution** | Solana Blinks / Actions API |
| **Deployment** | Vercel (frontend + serverless API) |

---

## 📈 On-Chain Architecture

**Program ID (Devnet):** `BPUdzBSLs2MptKdJZ68hkyMAVdWsotYWLCcSfrQ4AurG`

**Instructions:**

| Instruction | Who | Description |
|---|---|---|
| `initialize_config` | Admin | Set fee (250 bps = 2.5%) + treasury |
| `create_race` | Admin | Create race with horse_name + question |
| `place_bet` | User | Bet YES/NO, transfers SOL to vault |
| `start_race` | Admin | Move race Upcoming → Live |
| `start_live_betting` | Admin | Delegate vault to MagicBlock ER |
| `end_live_betting` | Admin | Commit ER state back to mainnet |
| `settle_race` | Admin | Resolve YES/NO, collect 2.5% fee |
| `claim_winnings` | User | Parimutuel payout to winners |

**Payout Model (Parimutuel):**
```
payout = (user_bet / total_winning_pool) × (total_pool − 2.5% fee)
```

**PDA Seeds:**
- Config: `["config"]`
- Race: `["race", race_id as le64]`
- Bet: `["bet", race_id as le64, user_pubkey]`
- Vault: `["vault", race_id as le64]`

---

## 🚀 Quick Start

```bash
# Frontend
npm install
npm run dev        # http://localhost:5173

# Smart Contract
cd contracts
anchor build       # Requires Anchor CLI + Rust toolchain
anchor test

# Deploy
npx vercel --prod
```

**Get devnet SOL:** Click "Get SOL" in the app (devnet airdrop) or visit https://faucet.solana.com

---

## 🏆 Hackathon Tracks

**Solana Graveyard Hackathon 2026 — Resurrecting dead crypto categories.**

| Track | Sponsor | Our Angle |
|---|---|---|
| Overall | Solana Foundation | Full product — resurrecting onchain horse racing |
| Gaming | MagicBlock | Financialized prediction game with ER in-play betting |
| Blinks | OrbitFlare | Resurrection of Solana Actions for prediction markets |

---

## 🔑 Key References

- MagicBlock ER Quickstart: https://docs.magicblock.gg/pages/ephemeral-rollups-ers/how-to-guide/quickstart
- ER SDK: https://github.com/magicblock-labs/ephemeral-rollups-sdk
- Solana Actions Spec: https://solana.com/developers/guides/advanced/actions
- Live Demo: https://slainteraces.vercel.app

---

*Sláinte. The best time to build is when everyone else has left.* 🍀
