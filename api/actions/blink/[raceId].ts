import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';

// ── Constants ────────────────────────────────────────────────────────────────
const PROGRAM_ID = new PublicKey('BPUdzBSLs2MptKdJZ68hkyMAVdWsotYWLCcSfrQ4AurG');
const DEVNET_RPC  = 'https://api.devnet.solana.com';
const SUPABASE_URL = 'https://auenoohozdpzcuxjseob.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZW5vb2hvemRwemN1eGpzZW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTU4MDIsImV4cCI6MjA4NjQ5MTgwMn0.C7G0YqvPeV6Dzr7OJ7WEmq3euBAtRhFx4969882I7Bc';
const BASE_URL    = 'https://slainteraces.vercel.app';

const PLACE_BET_DISCRIMINATOR = Buffer.from([222, 62, 67, 220, 63, 166, 126, 33]);

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'X-Action-Version':  '2.1.3',
  'X-Blockchain-Ids':  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  'Content-Type': 'application/json',
};

// ── PDA helpers ───────────────────────────────────────────────────────────────
function le64(n: number): Buffer {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(n), 0);
  return b;
}
function racePDA(id: number)              { return PublicKey.findProgramAddressSync([Buffer.from('race'), le64(id)], PROGRAM_ID); }
function betPDA(id: number, u: PublicKey) { return PublicKey.findProgramAddressSync([Buffer.from('bet'),  le64(id), u.toBuffer()], PROGRAM_ID); }
function vaultPDA(id: number)             { return PublicKey.findProgramAddressSync([Buffer.from('vault'), le64(id)], PROGRAM_ID); }

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers on every response
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') return res.status(200).end();

  const slug = String(req.query.raceId ?? '');
  const prediction = String(req.query.prediction ?? 'yes');
  const amountSol  = parseFloat(String(req.query.amount ?? '0.1'));

  // ── Fetch race from Supabase ─────────────────────────────────────────────
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  const searchName = slug.replace(/-/g, ' ');
  const { data: rows } = await sb
    .from('races')
    .select('*')
    .ilike('horse_name', searchName)
    .limit(1);
  const race = rows?.[0] ?? null;

  // Probabilities (real pool or demo fallback)
  const yesPool  = race?.yes_pool || 0;
  const noPool   = race?.no_pool  || 0;
  const total    = yesPool + noPool;
  const yesProb  = total > 0 ? Math.round((yesPool / total) * 100) : 50;
  const noProb   = 100 - yesProb;
  const raceName  = race?.horse_name  ?? slug.replace(/-/g, ' ');
  const trackName = race?.track_name  ?? 'Irish Track';
  const question  = race?.question    ?? `Will ${raceName} win?`;

  // ── GET → action metadata ─────────────────────────────────────────────────
  if (req.method === 'GET') {
    return res.status(200).json({
      type:        'action',
      icon:        `${BASE_URL}/favicon.png`,
      title:        question,
      description: `${trackName} · Irish Racing Market on Solana — Sláinte Races 🍀`,
      label:       'Place Bet',
      links: {
        actions: [
          {
            type:  'transaction',
            label: `YES ${yesProb}¢`,
            href:  `${BASE_URL}/api/actions/blink/${slug}?prediction=yes&amount={amount}`,
            parameters: [{ name: 'amount', label: 'SOL amount (e.g. 0.1)', required: true }],
          },
          {
            type:  'transaction',
            label: `NO ${noProb}¢`,
            href:  `${BASE_URL}/api/actions/blink/${slug}?prediction=no&amount={amount}`,
            parameters: [{ name: 'amount', label: 'SOL amount (e.g. 0.1)', required: true }],
          },
        ],
      },
    });
  }

  // ── POST → build & return transaction ─────────────────────────────────────
  if (req.method === 'POST') {
    const { account } = req.body as { account?: string };
    if (!account) return res.status(400).json({ message: 'Missing account' });

    if (!race?.onchain_race_id) {
      return res.status(404).json({ message: 'Race not found or not yet on-chain' });
    }

    try {
      const user     = new PublicKey(account);
      const raceId   = Number(race.onchain_race_id);
      const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);
      const isYes    = prediction === 'yes';

      const [rPDA]  = racePDA(raceId);
      const [bPDA]  = betPDA(raceId, user);
      const [vPDA]  = vaultPDA(raceId);

      const data = Buffer.alloc(17);
      PLACE_BET_DISCRIMINATOR.copy(data, 0);
      data.writeUInt8(isYes ? 1 : 0, 8);
      data.writeBigUInt64LE(BigInt(lamports), 9);

      const ix = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: rPDA,                    isSigner: false, isWritable: true },
          { pubkey: bPDA,                    isSigner: false, isWritable: true },
          { pubkey: vPDA,                    isSigner: false, isWritable: true },
          { pubkey: user,                    isSigner: true,  isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      });

      const conn = new Connection(DEVNET_RPC, 'confirmed');
      const { blockhash } = await conn.getLatestBlockhash();

      const tx = new Transaction({ recentBlockhash: blockhash, feePayer: user }).add(ix);
      const serialized = tx.serialize({ requireAllSignatures: false });

      return res.status(200).json({ transaction: serialized.toString('base64') });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ message: msg });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
