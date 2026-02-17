# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend
```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build
npm run lint      # ESLint check
npm run preview   # Preview production build
```

### Smart Contract (in `contracts/`)
```bash
anchor test       # Run Anchor test suite
cargo build       # Build Rust program
```

## Architecture

**Sláinte Races** is a Solana-based prediction market for Irish horse racing. It uses a parimutuel betting model where winners share the losing pool after a 2.5% fee.

### Stack
- **Frontend**: React + TypeScript + Vite, Tailwind CSS, Radix UI, Framer Motion, Recharts
- **Blockchain**: Solana Devnet, Anchor framework (`@coral-xyz/anchor` v0.30.0)
- **Backend**: Supabase (Postgres + Realtime subscriptions)
- **Wallet**: Phantom via `@solana/wallet-adapter-react`

### Key Files

| File | Role |
|------|------|
| `src/lib/solana.ts` | Anchor integration — PDA derivation, transaction builders for `placeBet`, `claimWinnings`, `settleRace`, etc. |
| `src/lib/supabase.ts` | All Supabase CRUD — races, bets, leaderboard, user profiles |
| `src/idl/slainteRacesIDL.json` | Anchor program IDL (auto-generated; don't edit manually) |
| `contracts/programs/workspace/src/lib.rs` | On-chain Anchor program (Rust) |
| `src/pages/Index.tsx` | Landing page + main markets view (~1062 lines) |
| `src/pages/Dashboard.tsx` | User bets, stats, claim winnings |

### On-Chain / Off-Chain Sync

All bets are recorded **both** on-chain and in Supabase. This dual-write is intentional: Supabase handles low-latency queries and real-time updates; Solana handles settlement and custody of funds.

**Program ID (Devnet):** `BPUdzBSLs2MptKdJZ68hkyMAVdWsotYWLCcSfrQ4AurG`

### Smart Contract Instructions

- `InitializeConfig` — Admin setup (fee_bps, treasury)
- `CreateRace` — Admin creates race (race_id, horse_name, question)
- `PlaceBet` — User bets (prediction: bool, amount: u64)
- `StartRace` — Admin moves race from Upcoming → Live
- `SettleRace` — Admin resolves race with YES/NO outcome
- `ClaimWinnings` — User claims parimutuel payout

### PDA Structure

Accounts are derived from seeds:
- Config: `["config"]`
- Race: `["race", race_id]`
- Bet: `["bet", race_pubkey, user_pubkey]`
- Vault: `["vault", race_pubkey]`

### Supabase Tables

- `races` — metadata (horse_name, track_name, question, status, yes_pool, no_pool)
- `bets` — user bets (user_wallet, race_id, prediction, amount, status)
- `user_profiles` — aggregated stats (total_bets, total_wagered, win_count)
- `leaderboard` — view ranked by wins/volume

Realtime subscriptions on `races` and `bets` drive live UI updates.

### Wallet Auth

No traditional auth — the connected wallet public key is the user identity everywhere (Supabase queries, on-chain accounts).

### Design System

Dark Bloomberg/Kalshi-style theme. Custom Tailwind colors:
- `racing-green`: `#00a86b` (YES bets, primary)
- `gold`: `#d4af37` (highlights)
- Background: `#0a0e17`, Card: `#111827`

### Solana Config

Supabase URL and anon key are hardcoded in `src/lib/supabase.ts`. Solana RPC is `https://api.devnet.solana.com`. The Anchor.toml in `contracts/` points to the same devnet cluster.
