import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "npm:@solana/web3.js@1";
import { Program, AnchorProvider, BN, Idl, web3 } from "npm:@coral-xyz/anchor@0.30.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PROGRAM_ID = new PublicKey('E4tZ3LdiNWq2cNfA4z5o9AYLSFMNtnmVgDD1GLCdMY7d');
const DEVNET_RPC = 'https://api.devnet.solana.com';

// Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// PDA derivation
function getRacePDA(raceId: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('race'), new BN(raceId).toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  );
  return pda;
}

function getBetPDA(raceId: number, user: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('bet'), new BN(raceId).toArrayLike(Buffer, 'le', 8), user.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

function getVaultPDA(raceId: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), new BN(raceId).toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  );
  return pda;
}

function getConfigPDA(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    PROGRAM_ID
  );
  return pda;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/slainte-actions', '');

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Actions.json manifest
    if (path === '/actions.json' || path === '') {
      return new Response(
        JSON.stringify({
          rules: [
            {
              pathPattern: '/bet/**',
              apiPath: '/slainte-actions/bet/**'
            }
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /bet/:raceId - Get action metadata
    if (path.startsWith('/bet/') && req.method === 'GET') {
      const raceId = path.split('/')[2];
      
      // Fetch race from database
      const { data: race, error } = await supabase
        .from('races')
        .select('*')
        .eq('onchain_race_id', parseInt(raceId))
        .maybeSingle();
      
      if (error || !race) {
        return new Response(
          JSON.stringify({ error: 'Race not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const totalPool = (race.yes_pool || 0) + (race.no_pool || 0);
      const yesOdds = race.yes_pool > 0 ? (totalPool / race.yes_pool).toFixed(2) : '2.00';
      const noOdds = race.no_pool > 0 ? (totalPool / race.no_pool).toFixed(2) : '2.00';

      const actionResponse = {
        type: 'action',
        icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        title: `🐎 ${race.horse_name} - ${race.track_name}`,
        description: `${race.question}\n\nYES Pool: ${(race.yes_pool || 0) / LAMPORTS_PER_SOL} SOL (${yesOdds}x)\nNO Pool: ${(race.no_pool || 0) / LAMPORTS_PER_SOL} SOL (${noOdds}x)`,
        label: 'Place Bet',
        links: {
          actions: [
            {
              label: 'Bet YES (0.1 SOL)',
              href: `/slainte-actions/bet/${raceId}?prediction=yes&amount=0.1`,
              type: 'transaction'
            },
            {
              label: 'Bet NO (0.1 SOL)',
              href: `/slainte-actions/bet/${raceId}?prediction=no&amount=0.1`,
              type: 'transaction'
            },
            {
              label: 'Bet YES (0.5 SOL)',
              href: `/slainte-actions/bet/${raceId}?prediction=yes&amount=0.5`,
              type: 'transaction'
            },
            {
              label: 'Bet NO (0.5 SOL)',
              href: `/slainte-actions/bet/${raceId}?prediction=no&amount=0.5`,
              type: 'transaction'
            }
          ]
        }
      };

      return new Response(
        JSON.stringify(actionResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /bet/:raceId - Execute bet transaction
    if (path.startsWith('/bet/') && req.method === 'POST') {
      const raceId = parseInt(path.split('/')[2]);
      const prediction = url.searchParams.get('prediction') === 'yes';
      const amount = parseFloat(url.searchParams.get('amount') || '0.1');
      const amountLamports = Math.floor(amount * LAMPORTS_PER_SOL);

      const body = await req.json();
      const userPubkey = new PublicKey(body.account);

      // Create transaction
      const connection = new Connection(DEVNET_RPC, 'confirmed');
      const configPDA = getConfigPDA();
      const racePDA = getRacePDA(raceId);
      const betPDA = getBetPDA(raceId, userPubkey);
      const vaultPDA = getVaultPDA(raceId);

      // Build the place_bet instruction manually
      // Discriminator for place_bet (first 8 bytes of sha256("global:place_bet"))
      const discriminator = Buffer.from([222, 62, 67, 220, 63, 166, 126, 33]);
      
      const raceIdBuffer = new BN(raceId).toArrayLike(Buffer, 'le', 8);
      const predictionBuffer = Buffer.from([prediction ? 1 : 0]);
      const amountBuffer = new BN(amountLamports).toArrayLike(Buffer, 'le', 8);
      
      const data = Buffer.concat([discriminator, raceIdBuffer, predictionBuffer, amountBuffer]);

      const placeBetIx = new web3.TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: userPubkey, isSigner: true, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: false },
          { pubkey: racePDA, isSigner: false, isWritable: true },
          { pubkey: betPDA, isSigner: false, isWritable: true },
          { pubkey: vaultPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data
      });

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      
      const transaction = new Transaction({
        feePayer: userPubkey,
        blockhash,
        lastValidBlockHeight
      }).add(placeBetIx);

      const serializedTx = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      return new Response(
        JSON.stringify({
          transaction: serializedTx.toString('base64'),
          message: `Placing ${prediction ? 'YES' : 'NO'} bet of ${amount} SOL on race ${raceId}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
