import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Idl } from '@coral-xyz/anchor';
import IDL from '@/idl/slainteRacesIDL.json';

// Program constants
export const PROGRAM_ID = new PublicKey('BPUdzBSLs2MptKdJZ68hkyMAVdWsotYWLCcSfrQ4AurG');
export const DEVNET_RPC = 'https://api.devnet.solana.com';

// Create connection
export const connection = new Connection(DEVNET_RPC, 'confirmed');

// PDA derivation functions
export function getConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    PROGRAM_ID
  );
}

export function getRacePDA(raceId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('race'), new BN(raceId).toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  );
}

export function getBetPDA(raceId: number, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('bet'), new BN(raceId).toArrayLike(Buffer, 'le', 8), user.toBuffer()],
    PROGRAM_ID
  );
}

export function getVaultPDA(raceId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), new BN(raceId).toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  );
}

// Get program instance
export function getProgram(wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction>; signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]> }) {
  const provider = new AnchorProvider(
    connection,
    wallet as never,
    { commitment: 'confirmed' }
  );
  return new Program(IDL as Idl, provider);
}

// Place bet instruction discriminator (from IDL)
const PLACE_BET_DISCRIMINATOR = Buffer.from([222, 62, 67, 220, 63, 166, 126, 33]);

// Build place bet transaction (returns unsigned transaction)
export async function buildPlaceBetTransaction(
  userPublicKey: PublicKey,
  raceId: number,
  prediction: boolean,
  amountLamports: number
): Promise<Transaction> {
  const [racePDA] = getRacePDA(raceId);
  const [betPDA] = getBetPDA(raceId, userPublicKey);
  const [vaultPDA] = getVaultPDA(raceId);
  
  // Build instruction data: discriminator + prediction (bool) + amount (u64)
  const data = Buffer.alloc(8 + 1 + 8);
  PLACE_BET_DISCRIMINATOR.copy(data, 0);
  data.writeUInt8(prediction ? 1 : 0, 8);
  data.writeBigUInt64LE(BigInt(amountLamports), 9);
  
  const instruction = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: racePDA, isSigner: false, isWritable: true },
      { pubkey: betPDA, isSigner: false, isWritable: true },
      { pubkey: vaultPDA, isSigner: false, isWritable: true },
      { pubkey: userPublicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
  
  const transaction = new Transaction().add(instruction);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = userPublicKey;
  
  return transaction;
}

// Place bet transaction (legacy - uses Anchor)
export async function placeBetTransaction(
  wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction>; signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]> },
  raceId: number,
  prediction: boolean, // true = YES, false = NO
  amountLamports: number
): Promise<string> {
  const program = getProgram(wallet);
  
  const [racePDA] = getRacePDA(raceId);
  const [betPDA] = getBetPDA(raceId, wallet.publicKey);
  const [vaultPDA] = getVaultPDA(raceId);
  
  // place_bet only takes prediction and amount as args
  const tx = await program.methods
    .placeBet(prediction, new BN(amountLamports))
    .accounts({
      race: racePDA,
      bet: betPDA,
      vault: vaultPDA,
      user: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  
  return tx;
}

// Claim winnings instruction discriminator (from IDL)
const CLAIM_WINNINGS_DISCRIMINATOR = Buffer.from([161, 215, 24, 59, 14, 236, 242, 221]);

// Build claim winnings transaction (returns unsigned transaction)
export async function buildClaimWinningsTransaction(
  userPublicKey: PublicKey,
  raceId: number
): Promise<Transaction> {
  const [configPDA] = getConfigPDA();
  const [racePDA] = getRacePDA(raceId);
  const [betPDA] = getBetPDA(raceId, userPublicKey);
  const [vaultPDA] = getVaultPDA(raceId);
  
  // Instruction data: just discriminator (no args)
  const data = CLAIM_WINNINGS_DISCRIMINATOR;
  
  const instruction = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: configPDA, isSigner: false, isWritable: false },
      { pubkey: racePDA, isSigner: false, isWritable: false },
      { pubkey: betPDA, isSigner: false, isWritable: true },
      { pubkey: vaultPDA, isSigner: false, isWritable: true },
      { pubkey: userPublicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
  
  const transaction = new Transaction().add(instruction);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = userPublicKey;
  
  return transaction;
}

// Claim winnings transaction (legacy - uses Anchor)
export async function claimWinningsTransaction(
  wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction>; signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]> },
  raceId: number
): Promise<string> {
  const program = getProgram(wallet);
  
  const [configPDA] = getConfigPDA();
  const [racePDA] = getRacePDA(raceId);
  const [betPDA] = getBetPDA(raceId, wallet.publicKey);
  const [vaultPDA] = getVaultPDA(raceId);
  
  // claim_winnings takes no args
  const tx = await program.methods
    .claimWinnings()
    .accounts({
      config: configPDA,
      race: racePDA,
      bet: betPDA,
      vault: vaultPDA,
      user: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  
  return tx;
}

// Check if config is initialized
export async function isConfigInitialized(): Promise<boolean> {
  const [configPDA] = getConfigPDA();
  try {
    const accountInfo = await connection.getAccountInfo(configPDA);
    return accountInfo !== null;
  } catch {
    return false;
  }
}

// Check if race exists on-chain
export async function isRaceCreated(raceId: number): Promise<boolean> {
  const [racePDA] = getRacePDA(raceId);
  try {
    const accountInfo = await connection.getAccountInfo(racePDA);
    return accountInfo !== null;
  } catch {
    return false;
  }
}

// Initialize config (admin only)
export async function initializeConfig(
  wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction>; signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]> },
  feeBps: number,
  treasury: PublicKey
): Promise<string> {
  const program = getProgram(wallet);
  const [configPDA] = getConfigPDA();
  
  const tx = await program.methods
    .initializeConfig(feeBps, treasury)
    .accounts({
      config: configPDA,
      authority: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  
  return tx;
}

// Create race on-chain (admin only)
export async function createRaceOnChain(
  wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction>; signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]> },
  raceId: number,
  horseName: string,
  question: string
): Promise<string> {
  const program = getProgram(wallet);
  
  const [configPDA] = getConfigPDA();
  const [racePDA] = getRacePDA(raceId);
  const [vaultPDA] = getVaultPDA(raceId);
  
  const tx = await program.methods
    .createRace(new BN(raceId), horseName, question)
    .accounts({
      config: configPDA,
      race: racePDA,
      vault: vaultPDA,
      authority: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  
  return tx;
}

// Start race (admin only) - changes status from upcoming to live
export async function startRaceOnChain(
  wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction>; signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]> },
  raceId: number
): Promise<string> {
  const program = getProgram(wallet);
  
  const [configPDA] = getConfigPDA();
  const [racePDA] = getRacePDA(raceId);
  
  const tx = await program.methods
    .startRace()
    .accounts({
      config: configPDA,
      race: racePDA,
      authority: wallet.publicKey,
    })
    .rpc();
  
  return tx;
}

// Settle race (admin only)
export async function settleRaceOnChain(
  wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction>; signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]> },
  raceId: number,
  result: boolean, // true = YES wins, false = NO wins
  treasury: PublicKey
): Promise<string> {
  const program = getProgram(wallet);
  
  const [configPDA] = getConfigPDA();
  const [racePDA] = getRacePDA(raceId);
  const [vaultPDA] = getVaultPDA(raceId);
  
  const tx = await program.methods
    .settleRace(result)
    .accounts({
      config: configPDA,
      race: racePDA,
      vault: vaultPDA,
      treasury: treasury,
      authority: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  
  return tx;
}

// Fetch on-chain race data
export async function fetchOnChainRace(raceId: number) {
  const [racePDA] = getRacePDA(raceId);
  
  try {
    const accountInfo = await connection.getAccountInfo(racePDA);
    if (!accountInfo) return null;
    
    // The account exists, return the PDA
    return {
      pda: racePDA.toBase58(),
      exists: true
    };
  } catch {
    return null;
  }
}

// Get wallet SOL balance
export async function getWalletBalance(publicKey: PublicKey): Promise<number> {
  const balance = await connection.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

// Request airdrop (devnet only)
export async function requestAirdrop(publicKey: PublicKey, amount: number = 1): Promise<string> {
  const signature = await connection.requestAirdrop(
    publicKey,
    amount * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(signature, 'confirmed');
  return signature;
}

// Convert SOL to lamports
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}

// Convert lamports to SOL
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

// Format SOL amount for display
export function formatSol(lamports: number, decimals: number = 4): string {
  return lamportsToSol(lamports).toFixed(decimals);
}

// Calculate potential payout (parimutuel)
export function calculatePotentialPayout(
  betAmount: number,
  prediction: boolean,
  yesPool: number,
  noPool: number,
  feeBps: number = 250 // 2.5% default
): number {
  const totalPool = yesPool + noPool + betAmount;
  const winningPool = prediction ? yesPool + betAmount : noPool + betAmount;
  const losingPool = prediction ? noPool : yesPool;
  
  // Fee is taken from the total pool
  const feeAmount = Math.floor((totalPool * feeBps) / 10000);
  const poolAfterFees = totalPool - feeAmount;
  
  // User's share of the winning pool
  const userShare = betAmount / winningPool;
  
  // Payout = user's share of (winning pool + losing pool after fees)
  const payout = Math.floor(userShare * poolAfterFees);
  
  return payout;
}