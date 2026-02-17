import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } from "npm:@solana/web3.js@1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Solana Actions headers
const actionHeaders = {
  ...corsHeaders,
  "X-Action-Version": "2.1.3",
  "X-Blockchain-Ids": "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  "Content-Type": "application/json",
};

const PROGRAM_ID = new PublicKey("E4tZ3LdiNWq2cNfA4z5o9AYLSFMNtnmVgDD1GLCdMY7d");
const DEVNET_RPC = "https://api.devnet.solana.com";
const LAMPORTS_PER_SOL = 1_000_000_000;

// IDL discriminators for place_bet instruction
const PLACE_BET_DISCRIMINATOR = new Uint8Array([222, 62, 67, 220, 63, 166, 126, 33]);

function getRacePDA(raceId: bigint): PublicKey {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(raceId);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("race"), buffer],
    PROGRAM_ID
  );
  return pda;
}

function getBetPDA(raceId: bigint, user: PublicKey): PublicKey {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(raceId);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("bet"), buffer, user.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

function getVaultPDA(raceId: bigint): PublicKey {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(raceId);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), buffer],
    PROGRAM_ID
  );
  return pda;
}

function createPlaceBetInstruction(
  raceId: bigint,
  user: PublicKey,
  prediction: boolean,
  amountLamports: bigint
): TransactionInstruction {
  const racePDA = getRacePDA(raceId);
  const betPDA = getBetPDA(raceId, user);
  const vaultPDA = getVaultPDA(raceId);

  // Serialize instruction data: discriminator + prediction (bool) + amount (u64)
  const data = Buffer.alloc(8 + 1 + 8);
  data.set(PLACE_BET_DISCRIMINATOR, 0);
  data.writeUInt8(prediction ? 1 : 0, 8);
  data.writeBigUInt64LE(amountLamports, 9);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: racePDA, isSigner: false, isWritable: true },
      { pubkey: betPDA, isSigner: false, isWritable: true },
      { pubkey: vaultPDA, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const raceId = url.searchParams.get("raceId");

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: actionHeaders });
    }

    if (!raceId) {
      return new Response(
        JSON.stringify({ error: "Missing raceId parameter" }),
        { status: 400, headers: actionHeaders }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch race from database
    const { data: race, error } = await supabase
      .from("races")
      .select("*")
      .eq("id", raceId)
      .maybeSingle();

    if (error || !race) {
      return new Response(
        JSON.stringify({ error: "Race not found" }),
        { status: 404, headers: actionHeaders }
      );
    }

    if (!race.onchain_race_id) {
      return new Response(
        JSON.stringify({ error: "Race not available for betting yet" }),
        { status: 400, headers: actionHeaders }
      );
    }

    // Calculate odds
    const yesPool = race.yes_pool || 0;
    const noPool = race.no_pool || 0;
    const totalPool = yesPool + noPool;
    const yesOdds = yesPool > 0 ? (totalPool / yesPool).toFixed(2) : "2.00";
    const noOdds = noPool > 0 ? (totalPool / noPool).toFixed(2) : "2.00";
    const totalPoolSol = (totalPool / LAMPORTS_PER_SOL).toFixed(2);

    // GET - Return action metadata
    if (req.method === "GET") {
      const actionResponse = {
        type: "action",
        icon: "https://i.imgur.com/QJ5Ycrj.png",
        title: `🐎 ${race.horse_name}`,
        description: `${race.question}\n\n📍 ${race.track_name}\n💰 Pool: ${totalPoolSol} SOL\n\n📈 YES Odds: ${yesOdds}x | 📉 NO Odds: ${noOdds}x`,
        label: "Place Bet",
        links: {
          actions: [
            {
              type: "transaction",
              label: "Bet YES",
              href: `${url.origin}${url.pathname}?raceId=${raceId}&prediction=yes&amount={amount}`,
              parameters: [
                {
                  name: "amount",
                  label: "Bet Amount (SOL)",
                  required: true,
                  type: "number",
                },
              ],
            },
            {
              type: "transaction",
              label: "Bet NO",
              href: `${url.origin}${url.pathname}?raceId=${raceId}&prediction=no&amount={amount}`,
              parameters: [
                {
                  name: "amount",
                  label: "Bet Amount (SOL)",
                  required: true,
                  type: "number",
                },
              ],
            },
          ],
        },
      };

      return new Response(JSON.stringify(actionResponse), {
        status: 200,
        headers: actionHeaders,
      });
    }

    // POST - Build and return transaction
    if (req.method === "POST") {
      const prediction = url.searchParams.get("prediction");
      const amount = url.searchParams.get("amount");

      if (!prediction || !amount) {
        return new Response(
          JSON.stringify({ error: "Missing prediction or amount" }),
          { status: 400, headers: actionHeaders }
        );
      }

      const body = await req.json();
      const userPubkey = body.account;

      if (!userPubkey) {
        return new Response(
          JSON.stringify({ error: "Missing account in request body" }),
          { status: 400, headers: actionHeaders }
        );
      }

      const user = new PublicKey(userPubkey);
      const predictionBool = prediction.toLowerCase() === "yes";
      const amountSol = parseFloat(amount);
      const amountLamports = BigInt(Math.floor(amountSol * LAMPORTS_PER_SOL));
      const onchainRaceId = BigInt(race.onchain_race_id);

      // Build transaction
      const connection = new Connection(DEVNET_RPC, "confirmed");
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

      const instruction = createPlaceBetInstruction(
        onchainRaceId,
        user,
        predictionBool,
        amountLamports
      );

      const transaction = new Transaction();
      transaction.add(instruction);
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = user;

      // Serialize transaction
      const serializedTx = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const base64Tx = Buffer.from(serializedTx).toString("base64");

      const response = {
        type: "transaction",
        transaction: base64Tx,
        message: `Placing ${amountSol} SOL bet on ${predictionBool ? "YES" : "NO"} for ${race.horse_name}`,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: actionHeaders,
      });
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: actionHeaders }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: actionHeaders }
    );
  }
});
