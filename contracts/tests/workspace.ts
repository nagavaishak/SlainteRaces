import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Workspace } from "../target/types/workspace";
import { expect } from "chai";
import { 
  PublicKey, 
  SystemProgram, 
  Keypair, 
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

describe("slainte_races", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Workspace as Program<Workspace>;

  let authority: Keypair;
  let treasury: Keypair;
  let user1: Keypair;
  let user2: Keypair;
  let user3: Keypair;
  let configPDA: PublicKey;
  let configBump: number;

  const FEE_BPS = 250; // 2.5%
  const RACE_ID = new BN(1);
  const HORSE_NAME = "Thunder Bolt";
  const QUESTION = "Will Thunder Bolt win the Dublin Derby?";

  before(async () => {
    authority = Keypair.generate();
    treasury = Keypair.generate();
    user1 = Keypair.generate();
    user2 = Keypair.generate();
    user3 = Keypair.generate();

    // Fund all accounts
    const accounts = [authority, treasury, user1, user2, user3];
    for (const account of accounts) {
      const sig = await provider.connection.requestAirdrop(
        account.publicKey,
        100 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);
    }

    // Derive config PDA
    [configPDA, configBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
  });

  const getRacePDA = (raceId: BN): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("race"), raceId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
  };

  const getVaultPDA = (raceId: BN): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), raceId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
  };

  const getBetPDA = (raceId: BN, user: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), raceId.toArrayLike(Buffer, "le", 8), user.toBuffer()],
      program.programId
    );
  };

  describe("Initialize Config", () => {
    it("should initialize config successfully", async () => {
      await program.methods
        .initializeConfig(FEE_BPS, treasury.publicKey)
        .accounts({
          config: configPDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const config = await program.account.config.fetch(configPDA);
      expect(config.authority.toString()).to.equal(authority.publicKey.toString());
      expect(config.feeBps).to.equal(FEE_BPS);
      expect(config.treasury.toString()).to.equal(treasury.publicKey.toString());
      expect(config.totalRaces.toNumber()).to.equal(0);
    });

    it("should fail to initialize config twice", async () => {
      try {
        await program.methods
          .initializeConfig(FEE_BPS, treasury.publicKey)
          .accounts({
            config: configPDA,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.message).to.include("already in use");
      }
    });
  });

  describe("Create Race", () => {
    it("should create a race successfully", async () => {
      const [racePDA] = getRacePDA(RACE_ID);
      const [vaultPDA] = getVaultPDA(RACE_ID);

      await program.methods
        .createRace(RACE_ID, HORSE_NAME, QUESTION)
        .accounts({
          config: configPDA,
          race: racePDA,
          vault: vaultPDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const race = await program.account.race.fetch(racePDA);
      expect(race.raceId.toNumber()).to.equal(RACE_ID.toNumber());
      expect(race.horseName).to.equal(HORSE_NAME);
      expect(race.question).to.equal(QUESTION);
      expect(race.yesPool.toNumber()).to.equal(0);
      expect(race.noPool.toNumber()).to.equal(0);
      expect(race.status).to.deep.equal({ upcoming: {} });
      expect(race.result).to.be.null;

      const config = await program.account.config.fetch(configPDA);
      expect(config.totalRaces.toNumber()).to.equal(1);
    });

    it("should fail to create race with non-authority", async () => {
      const raceId2 = new BN(2);
      const [racePDA] = getRacePDA(raceId2);
      const [vaultPDA] = getVaultPDA(raceId2);

      try {
        await program.methods
          .createRace(raceId2, "Another Horse", "Will it win?")
          .accounts({
            config: configPDA,
            race: racePDA,
            vault: vaultPDA,
            authority: user1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.message).to.include("Unauthorized");
      }
    });

    it("should fail with horse name too long", async () => {
      const raceId3 = new BN(3);
      const [racePDA] = getRacePDA(raceId3);
      const [vaultPDA] = getVaultPDA(raceId3);
      const longName = "A".repeat(33);

      try {
        await program.methods
          .createRace(raceId3, longName, "Question?")
          .accounts({
            config: configPDA,
            race: racePDA,
            vault: vaultPDA,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.message).to.include("Horse name too long");
      }
    });
  });

  describe("Place Bet", () => {
    it("should place YES bet successfully", async () => {
      const [racePDA] = getRacePDA(RACE_ID);
      const [vaultPDA] = getVaultPDA(RACE_ID);
      const [betPDA] = getBetPDA(RACE_ID, user1.publicKey);
      const betAmount = new BN(1 * LAMPORTS_PER_SOL);

      const vaultBalanceBefore = await provider.connection.getBalance(vaultPDA);

      await program.methods
        .placeBet(true, betAmount)
        .accounts({
          race: racePDA,
          bet: betPDA,
          vault: vaultPDA,
          user: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const bet = await program.account.bet.fetch(betPDA);
      expect(bet.raceId.toNumber()).to.equal(RACE_ID.toNumber());
      expect(bet.user.toString()).to.equal(user1.publicKey.toString());
      expect(bet.prediction).to.be.true;
      expect(bet.amount.toNumber()).to.equal(betAmount.toNumber());
      expect(bet.claimed).to.be.false;

      const race = await program.account.race.fetch(racePDA);
      expect(race.yesPool.toNumber()).to.equal(betAmount.toNumber());
      expect(race.noPool.toNumber()).to.equal(0);

      const vaultBalanceAfter = await provider.connection.getBalance(vaultPDA);
      expect(vaultBalanceAfter - vaultBalanceBefore).to.equal(betAmount.toNumber());
    });

    it("should place NO bet successfully", async () => {
      const [racePDA] = getRacePDA(RACE_ID);
      const [vaultPDA] = getVaultPDA(RACE_ID);
      const [betPDA] = getBetPDA(RACE_ID, user2.publicKey);
      const betAmount = new BN(2 * LAMPORTS_PER_SOL);

      await program.methods
        .placeBet(false, betAmount)
        .accounts({
          race: racePDA,
          bet: betPDA,
          vault: vaultPDA,
          user: user2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user2])
        .rpc();

      const bet = await program.account.bet.fetch(betPDA);
      expect(bet.prediction).to.be.false;
      expect(bet.amount.toNumber()).to.equal(betAmount.toNumber());

      const race = await program.account.race.fetch(racePDA);
      expect(race.noPool.toNumber()).to.equal(betAmount.toNumber());
    });

    it("should allow additional bet from same user", async () => {
      const [racePDA] = getRacePDA(RACE_ID);
      const [vaultPDA] = getVaultPDA(RACE_ID);
      const [betPDA] = getBetPDA(RACE_ID, user1.publicKey);
      const additionalBet = new BN(0.5 * LAMPORTS_PER_SOL);

      const betBefore = await program.account.bet.fetch(betPDA);
      const expectedTotal = betBefore.amount.add(additionalBet);

      await program.methods
        .placeBet(true, additionalBet)
        .accounts({
          race: racePDA,
          bet: betPDA,
          vault: vaultPDA,
          user: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const betAfter = await program.account.bet.fetch(betPDA);
      expect(betAfter.amount.toNumber()).to.equal(expectedTotal.toNumber());
    });

    it("should fail with zero amount", async () => {
      const [racePDA] = getRacePDA(RACE_ID);
      const [vaultPDA] = getVaultPDA(RACE_ID);
      const [betPDA] = getBetPDA(RACE_ID, user3.publicKey);

      try {
        await program.methods
          .placeBet(true, new BN(0))
          .accounts({
            race: racePDA,
            bet: betPDA,
            vault: vaultPDA,
            user: user3.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([user3])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.message).to.include("Invalid amount");
      }
    });
  });

  describe("Start Race", () => {
    it("should start race successfully", async () => {
      const [racePDA] = getRacePDA(RACE_ID);

      await program.methods
        .startRace()
        .accounts({
          config: configPDA,
          race: racePDA,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      const race = await program.account.race.fetch(racePDA);
      expect(race.status).to.deep.equal({ live: {} });
    });

    it("should fail to start already live race", async () => {
      const [racePDA] = getRacePDA(RACE_ID);

      try {
        await program.methods
          .startRace()
          .accounts({
            config: configPDA,
            race: racePDA,
            authority: authority.publicKey,
          })
          .signers([authority])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.message).to.include("Invalid race status");
      }
    });

    it("should allow betting on live race", async () => {
      const [racePDA] = getRacePDA(RACE_ID);
      const [vaultPDA] = getVaultPDA(RACE_ID);
      const [betPDA] = getBetPDA(RACE_ID, user3.publicKey);
      const betAmount = new BN(0.5 * LAMPORTS_PER_SOL);

      await program.methods
        .placeBet(true, betAmount)
        .accounts({
          race: racePDA,
          bet: betPDA,
          vault: vaultPDA,
          user: user3.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user3])
        .rpc();

      const bet = await program.account.bet.fetch(betPDA);
      expect(bet.amount.toNumber()).to.equal(betAmount.toNumber());
    });
  });

  describe("Settle Race", () => {
    it("should settle race with YES result", async () => {
      const [racePDA] = getRacePDA(RACE_ID);
      const [vaultPDA] = getVaultPDA(RACE_ID);

      const raceBefore = await program.account.race.fetch(racePDA);
      const totalPool = raceBefore.yesPool.add(raceBefore.noPool);
      const expectedFee = totalPool.muln(FEE_BPS).divn(10000);

      const treasuryBalanceBefore = await provider.connection.getBalance(treasury.publicKey);

      await program.methods
        .settleRace(true)
        .accounts({
          config: configPDA,
          race: racePDA,
          vault: vaultPDA,
          treasury: treasury.publicKey,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const race = await program.account.race.fetch(racePDA);
      expect(race.status).to.deep.equal({ settled: {} });
      expect(race.result).to.be.true;
      expect(race.settledAt).to.not.be.null;

      const treasuryBalanceAfter = await provider.connection.getBalance(treasury.publicKey);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedFee.toNumber());
    });

    it("should fail to settle already settled race", async () => {
      const [racePDA] = getRacePDA(RACE_ID);
      const [vaultPDA] = getVaultPDA(RACE_ID);

      try {
        await program.methods
          .settleRace(false)
          .accounts({
            config: configPDA,
            race: racePDA,
            vault: vaultPDA,
            treasury: treasury.publicKey,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.message).to.include("Invalid race status");
      }
    });
  });

  describe("Claim Winnings", () => {
    it("should claim winnings for YES winner (user1)", async () => {
      const [racePDA] = getRacePDA(RACE_ID);
      const [vaultPDA] = getVaultPDA(RACE_ID);
      const [betPDA] = getBetPDA(RACE_ID, user1.publicKey);

      const race = await program.account.race.fetch(racePDA);
      const bet = await program.account.bet.fetch(betPDA);
      const config = await program.account.config.fetch(configPDA);

      const totalPool = race.yesPool.add(race.noPool);
      const fee = totalPool.muln(config.feeBps).divn(10000);
      const poolAfterFees = totalPool.sub(fee);
      const expectedPayout = bet.amount.mul(poolAfterFees).div(race.yesPool);

      const userBalanceBefore = await provider.connection.getBalance(user1.publicKey);

      await program.methods
        .claimWinnings()
        .accounts({
          config: configPDA,
          race: racePDA,
          bet: betPDA,
          vault: vaultPDA,
          user: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const betAfter = await program.account.bet.fetch(betPDA);
      expect(betAfter.claimed).to.be.true;

      const userBalanceAfter = await provider.connection.getBalance(user1.publicKey);
      // Account for transaction fees
      const balanceChange = userBalanceAfter - userBalanceBefore;
      expect(balanceChange).to.be.greaterThan(expectedPayout.toNumber() - 10000);
    });

    it("should claim winnings for YES winner (user3)", async () => {
      const [racePDA] = getRacePDA(RACE_ID);
      const [vaultPDA] = getVaultPDA(RACE_ID);
      const [betPDA] = getBetPDA(RACE_ID, user3.publicKey);

      await program.methods
        .claimWinnings()
        .accounts({
          config: configPDA,
          race: racePDA,
          bet: betPDA,
          vault: vaultPDA,
          user: user3.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user3])
        .rpc();

      const betAfter = await program.account.bet.fetch(betPDA);
      expect(betAfter.claimed).to.be.true;
    });

    it("should fail to claim for NO loser (user2)", async () => {
      const [racePDA] = getRacePDA(RACE_ID);
      const [vaultPDA] = getVaultPDA(RACE_ID);
      const [betPDA] = getBetPDA(RACE_ID, user2.publicKey);

      try {
        await program.methods
          .claimWinnings()
          .accounts({
            config: configPDA,
            race: racePDA,
            bet: betPDA,
            vault: vaultPDA,
            user: user2.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([user2])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.message).to.include("Bet did not win");
      }
    });

    it("should fail to claim twice", async () => {
      const [racePDA] = getRacePDA(RACE_ID);
      const [vaultPDA] = getVaultPDA(RACE_ID);
      const [betPDA] = getBetPDA(RACE_ID, user1.publicKey);

      try {
        await program.methods
          .claimWinnings()
          .accounts({
            config: configPDA,
            race: racePDA,
            bet: betPDA,
            vault: vaultPDA,
            user: user1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.message).to.include("already claimed");
      }
    });
  });

  describe("Full Flow - NO Wins Scenario", () => {
    const RACE_ID_2 = new BN(10);
    
    it("should complete full flow with NO winning", async () => {
      const [racePDA] = getRacePDA(RACE_ID_2);
      const [vaultPDA] = getVaultPDA(RACE_ID_2);
      const [betPDA1] = getBetPDA(RACE_ID_2, user1.publicKey);
      const [betPDA2] = getBetPDA(RACE_ID_2, user2.publicKey);

      // Create race
      await program.methods
        .createRace(RACE_ID_2, "Lucky Star", "Will Lucky Star place top 3?")
        .accounts({
          config: configPDA,
          race: racePDA,
          vault: vaultPDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      // User1 bets YES
      await program.methods
        .placeBet(true, new BN(1 * LAMPORTS_PER_SOL))
        .accounts({
          race: racePDA,
          bet: betPDA1,
          vault: vaultPDA,
          user: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      // User2 bets NO
      await program.methods
        .placeBet(false, new BN(1 * LAMPORTS_PER_SOL))
        .accounts({
          race: racePDA,
          bet: betPDA2,
          vault: vaultPDA,
          user: user2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user2])
        .rpc();

      // Start race
      await program.methods
        .startRace()
        .accounts({
          config: configPDA,
          race: racePDA,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      // Settle with NO winning
      await program.methods
        .settleRace(false)
        .accounts({
          config: configPDA,
          race: racePDA,
          vault: vaultPDA,
          treasury: treasury.publicKey,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const race = await program.account.race.fetch(racePDA);
      expect(race.result).to.be.false;

      // User2 (NO) should be able to claim
      const user2BalanceBefore = await provider.connection.getBalance(user2.publicKey);
      
      await program.methods
        .claimWinnings()
        .accounts({
          config: configPDA,
          race: racePDA,
          bet: betPDA2,
          vault: vaultPDA,
          user: user2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user2])
        .rpc();

      const user2BalanceAfter = await provider.connection.getBalance(user2.publicKey);
      expect(user2BalanceAfter).to.be.greaterThan(user2BalanceBefore);

      // User1 (YES) should fail to claim
      try {
        await program.methods
          .claimWinnings()
          .accounts({
            config: configPDA,
            race: racePDA,
            bet: betPDA1,
            vault: vaultPDA,
            user: user1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.message).to.include("Bet did not win");
      }
    });
  });

  describe("Edge Cases", () => {
    it("should fail to bet on settled race", async () => {
      const [racePDA] = getRacePDA(RACE_ID);
      const [vaultPDA] = getVaultPDA(RACE_ID);
      
      const newUser = Keypair.generate();
      const sig = await provider.connection.requestAirdrop(newUser.publicKey, 10 * LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(sig);
      
      const [betPDA] = getBetPDA(RACE_ID, newUser.publicKey);

      try {
        await program.methods
          .placeBet(true, new BN(0.1 * LAMPORTS_PER_SOL))
          .accounts({
            race: racePDA,
            bet: betPDA,
            vault: vaultPDA,
            user: newUser.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([newUser])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.message).to.include("Race is not open");
      }
    });

    it("should fail to settle with wrong treasury", async () => {
      const RACE_ID_3 = new BN(20);
      const [racePDA] = getRacePDA(RACE_ID_3);
      const [vaultPDA] = getVaultPDA(RACE_ID_3);
      const [betPDA] = getBetPDA(RACE_ID_3, user1.publicKey);
      const wrongTreasury = Keypair.generate();

      // Create and start race
      await program.methods
        .createRace(RACE_ID_3, "Test Horse", "Test question?")
        .accounts({
          config: configPDA,
          race: racePDA,
          vault: vaultPDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      await program.methods
        .placeBet(true, new BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
          race: racePDA,
          bet: betPDA,
          vault: vaultPDA,
          user: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      await program.methods
        .startRace()
        .accounts({
          config: configPDA,
          race: racePDA,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      try {
        await program.methods
          .settleRace(true)
          .accounts({
            config: configPDA,
            race: racePDA,
            vault: vaultPDA,
            treasury: wrongTreasury.publicKey,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.message).to.include("Invalid treasury");
      }
    });
  });
});
