import { Connection } from '@solana/web3.js';

// Base Solana Devnet connection (normal 400ms latency)
export const baseConnection = new Connection(
  'https://api.devnet.solana.com',
  'confirmed'
);

// MagicBlock Ephemeral Rollup endpoint (~10ms latency)
// Used for live race in-play betting — race pool must be delegated to ER first
export const erConnection = new Connection(
  'https://devnet.magicblock.app/',
  {
    wsEndpoint: 'wss://devnet.magicblock.app/',
    commitment: 'confirmed',
  }
);

// MagicBlock Devnet ER Validator pubkey (EU region)
export const ER_VALIDATOR = 'MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e';

/**
 * Returns the appropriate connection based on race status.
 * Live races route through MagicBlock Ephemeral Rollup for 10ms bets.
 * Upcoming/settled races use standard Solana Devnet.
 */
export function getConnectionForRace(isLive: boolean): Connection {
  return isLive ? erConnection : baseConnection;
}
