use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey;
use anchor_lang::system_program;
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::commit_and_undelegate_accounts;

declare_id!("BPUdzBSLs2MptKdJZ68hkyMAVdWsotYWLCcSfrQ4AurG");

/// MagicBlock Ephemeral Rollup marker — enables ER delegation on this program
#[ephemeral]
#[program]
pub mod workspace {
    use super::*;

    // fee_bps: u16, Platform fee in basis points, 250 = 2.5%
    // treasury: Pubkey, Fee collection wallet address, 9xQeW...Fin
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        fee_bps: u16,
        treasury: Pubkey,
    ) -> Result<()> {
        require!(fee_bps <= 10000, ErrorCode::InvalidFee);
        
        let config = &mut ctx.accounts.config;
        config.bump = ctx.bumps.config;
        config.authority = ctx.accounts.authority.key();
        config.fee_bps = fee_bps;
        config.treasury = treasury;
        config.total_races = 0;
        
        emit!(ConfigInitialized {
            authority: config.authority,
            fee_bps,
            treasury,
        });
        
        Ok(())
    }

    // race_id: u64, Unique race identifier, 1
    // horse_name: String, Name of the horse (max 32 chars), "Thunder Bolt"
    // question: String, Betting question (max 128 chars), "Will Thunder Bolt win the Dublin Derby?"
    pub fn create_race(
        ctx: Context<CreateRace>,
        race_id: u64,
        horse_name: String,
        question: String,
    ) -> Result<()> {
        require!(horse_name.len() <= 32, ErrorCode::HorseNameTooLong);
        require!(question.len() <= 128, ErrorCode::QuestionTooLong);
        
        let race = &mut ctx.accounts.race;
        race.bump = ctx.bumps.race;
        race.vault_bump = ctx.bumps.vault;
        race.race_id = race_id;
        race.authority = ctx.accounts.authority.key();
        race.horse_name = horse_name.clone();
        race.question = question.clone();
        race.yes_pool = 0;
        race.no_pool = 0;
        race.status = RaceStatus::Upcoming;
        race.result = None;
        race.created_at = Clock::get()?.unix_timestamp;
        race.settled_at = None;
        
        let config = &mut ctx.accounts.config;
        config.total_races = config.total_races.checked_add(1).ok_or(ErrorCode::MathOverflow)?;
        
        emit!(RaceCreated {
            race_id,
            horse_name,
            question,
            created_at: race.created_at,
        });
        
        Ok(())
    }

    // prediction: bool, Bet prediction (true = YES, false = NO), true
    // amount: u64, Bet amount in lamports, 1000000000
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        prediction: bool,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        
        let race = &ctx.accounts.race;
        require!(
            race.status == RaceStatus::Upcoming || race.status == RaceStatus::Live,
            ErrorCode::RaceNotOpen
        );
        
        // Transfer SOL from user to vault
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            amount,
        )?;
        
        let race_id = race.race_id;
        
        // Update bet account
        let bet = &mut ctx.accounts.bet;
        bet.bump = ctx.bumps.bet;
        bet.race_id = race_id;
        bet.user = ctx.accounts.user.key();
        bet.prediction = prediction;
        bet.amount = bet.amount.checked_add(amount).ok_or(ErrorCode::MathOverflow)?;
        bet.claimed = false;
        bet.created_at = Clock::get()?.unix_timestamp;
        
        // Update race pools
        let race = &mut ctx.accounts.race;
        if prediction {
            race.yes_pool = race.yes_pool.checked_add(amount).ok_or(ErrorCode::MathOverflow)?;
        } else {
            race.no_pool = race.no_pool.checked_add(amount).ok_or(ErrorCode::MathOverflow)?;
        }
        
        emit!(BetPlaced {
            race_id,
            user: ctx.accounts.user.key(),
            prediction,
            amount,
            total_bet: bet.amount,
        });
        
        Ok(())
    }

    pub fn start_race(ctx: Context<StartRace>) -> Result<()> {
        let race = &mut ctx.accounts.race;
        require!(race.status == RaceStatus::Upcoming, ErrorCode::InvalidRaceStatus);
        
        race.status = RaceStatus::Live;
        
        emit!(RaceStarted {
            race_id: race.race_id,
            started_at: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    // result: bool, Race result (true = YES wins, false = NO wins), true
    pub fn settle_race(ctx: Context<SettleRace>, result: bool) -> Result<()> {
        let race = &ctx.accounts.race;
        require!(race.status == RaceStatus::Live, ErrorCode::InvalidRaceStatus);
        
        let config = &ctx.accounts.config;
        let total_pool = race.yes_pool.checked_add(race.no_pool).ok_or(ErrorCode::MathOverflow)?;
        
        // Calculate and transfer platform fee to treasury
        if total_pool > 0 {
            let fee = total_pool
                .checked_mul(config.fee_bps as u64)
                .ok_or(ErrorCode::MathOverflow)?
                .checked_div(10000)
                .ok_or(ErrorCode::DivisionByZero)?;
            
            if fee > 0 {
                let race_id_bytes = race.race_id.to_le_bytes();
                let vault_bump = race.vault_bump;
                let vault_seeds: &[&[u8]] = &[b"vault", race_id_bytes.as_ref(), &[vault_bump]];
                let signer_seeds: &[&[&[u8]]] = &[vault_seeds];
                
                system_program::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.system_program.to_account_info(),
                        system_program::Transfer {
                            from: ctx.accounts.vault.to_account_info(),
                            to: ctx.accounts.treasury.to_account_info(),
                        },
                        signer_seeds,
                    ),
                    fee,
                )?;
            }
        }
        
        // Update race state
        let race = &mut ctx.accounts.race;
        race.status = RaceStatus::Settled;
        race.result = Some(result);
        race.settled_at = Some(Clock::get()?.unix_timestamp);
        
        emit!(RaceSettled {
            race_id: race.race_id,
            result,
            yes_pool: race.yes_pool,
            no_pool: race.no_pool,
            settled_at: race.settled_at.unwrap(),
        });
        
        Ok(())
    }

    /// Emergency authority migration — callable only by the program upgrade authority.
    /// Transfers config.authority + treasury to a new wallet (e.g. migrating admin keys).
    pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = new_authority;
        config.treasury = new_authority;
        Ok(())
    }

    /// Emergency race authority migration — callable only by the program upgrade authority.
    pub fn transfer_race_authority(ctx: Context<TransferRaceAuthority>, new_authority: Pubkey) -> Result<()> {
        let race = &mut ctx.accounts.race;
        race.authority = new_authority;
        Ok(())
    }

    /// Delegate race account PDA to MagicBlock Ephemeral Rollup for live in-play betting.
    /// The race account (owned by our program) tracks yes_pool/no_pool — delegating it
    /// lets the ER process pool updates at ~10ms. SOL custody remains on mainnet vault.
    pub fn start_live_betting(ctx: Context<DelegateRaceAccount>) -> Result<()> {
        let race_id_bytes = ctx.accounts.race.race_id.to_le_bytes();
        let seeds: &[&[u8]] = &[b"race", race_id_bytes.as_ref()];

        ctx.accounts.delegate_race(
            &ctx.accounts.payer,
            seeds,
            DelegateConfig {
                validator: ctx.remaining_accounts.first().map(|acc| acc.key()),
                commit_frequency_ms: 30_000,
                ..Default::default()
            },
        )?;

        emit!(LiveBettingStarted {
            race_id: ctx.accounts.race.race_id,
            started_at: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Commit accumulated ER state + undelegate race account back to Solana mainnet.
    /// Settlement (settle_race + claim_winnings) proceeds on mainnet after this.
    pub fn end_live_betting(ctx: Context<CommitRaceAccount>) -> Result<()> {
        commit_and_undelegate_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.race.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;

        emit!(LiveBettingEnded {
            race_id: ctx.accounts.race.race_id,
            ended_at: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let race = &ctx.accounts.race;
        let bet = &ctx.accounts.bet;
        let config = &ctx.accounts.config;
        
        require!(race.status == RaceStatus::Settled, ErrorCode::RaceNotSettled);
        require!(!bet.claimed, ErrorCode::AlreadyClaimed);
        
        let result = race.result.ok_or(ErrorCode::RaceNotSettled)?;
        require!(bet.prediction == result, ErrorCode::NotAWinner);
        
        let total_pool = race.yes_pool.checked_add(race.no_pool).ok_or(ErrorCode::MathOverflow)?;
        let fee = total_pool
            .checked_mul(config.fee_bps as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::DivisionByZero)?;
        let pool_after_fees = total_pool.checked_sub(fee).ok_or(ErrorCode::MathOverflow)?;
        
        let winning_pool = if result { race.yes_pool } else { race.no_pool };
        require!(winning_pool > 0, ErrorCode::NoWinningPool);
        
        // Calculate user's share: (user_bet / winning_pool) * pool_after_fees
        let payout = bet.amount
            .checked_mul(pool_after_fees)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(winning_pool)
            .ok_or(ErrorCode::DivisionByZero)?;
        
        require!(payout > 0, ErrorCode::NoPayout);
        
        // Transfer winnings from vault to user
        let race_id_bytes = race.race_id.to_le_bytes();
        let vault_bump = race.vault_bump;
        let vault_seeds: &[&[u8]] = &[b"vault", race_id_bytes.as_ref(), &[vault_bump]];
        let signer_seeds: &[&[&[u8]]] = &[vault_seeds];
        
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.user.to_account_info(),
                },
                signer_seeds,
            ),
            payout,
        )?;
        
        // Mark bet as claimed
        let bet = &mut ctx.accounts.bet;
        bet.claimed = true;
        
        emit!(WinningsClaimed {
            race_id: race.race_id,
            user: ctx.accounts.user.key(),
            payout,
        });
        
        Ok(())
    }
}

// ============== ACCOUNTS ==============

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        seeds = [b"config"],
        bump,
        payer = authority,
        space = 8 + Config::LEN
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(race_id: u64)]
pub struct CreateRace<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority @ ErrorCode::Unauthorized
    )]
    pub config: Account<'info, Config>,
    #[account(
        init,
        seeds = [b"race", race_id.to_le_bytes().as_ref()],
        bump,
        payer = authority,
        space = 8 + Race::LEN
    )]
    pub race: Account<'info, Race>,
    /// CHECK: Vault PDA for holding bets
    #[account(
        mut,
        seeds = [b"vault", race_id.to_le_bytes().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(
        mut,
        seeds = [b"race", race.race_id.to_le_bytes().as_ref()],
        bump = race.bump
    )]
    pub race: Account<'info, Race>,
    #[account(
        init_if_needed,
        seeds = [b"bet", race.race_id.to_le_bytes().as_ref(), user.key().as_ref()],
        bump,
        payer = user,
        space = 8 + Bet::LEN
    )]
    pub bet: Account<'info, Bet>,
    /// CHECK: Vault PDA for holding bets
    #[account(
        mut,
        seeds = [b"vault", race.race_id.to_le_bytes().as_ref()],
        bump = race.vault_bump
    )]
    pub vault: SystemAccount<'info>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StartRace<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority @ ErrorCode::Unauthorized
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [b"race", race.race_id.to_le_bytes().as_ref()],
        bump = race.bump
    )]
    pub race: Account<'info, Race>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SettleRace<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority @ ErrorCode::Unauthorized,
        constraint = config.treasury == treasury.key() @ ErrorCode::InvalidTreasury
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [b"race", race.race_id.to_le_bytes().as_ref()],
        bump = race.bump
    )]
    pub race: Account<'info, Race>,
    /// CHECK: Vault PDA for holding bets
    #[account(
        mut,
        seeds = [b"vault", race.race_id.to_le_bytes().as_ref()],
        bump = race.vault_bump
    )]
    pub vault: SystemAccount<'info>,
    /// CHECK: Treasury account verified by config constraint
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
    #[account(
        seeds = [b"race", race.race_id.to_le_bytes().as_ref()],
        bump = race.bump
    )]
    pub race: Account<'info, Race>,
    #[account(
        mut,
        seeds = [b"bet", bet.race_id.to_le_bytes().as_ref(), user.key().as_ref()],
        bump = bet.bump,
        constraint = bet.user == user.key() @ ErrorCode::Unauthorized
    )]
    pub bet: Account<'info, Bet>,
    /// CHECK: Vault PDA for holding bets
    #[account(
        mut,
        seeds = [b"vault", race.race_id.to_le_bytes().as_ref()],
        bump = race.vault_bump
    )]
    pub vault: SystemAccount<'info>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ============== STATE ==============

#[account]
pub struct Config {
    pub bump: u8,
    pub authority: Pubkey,
    pub fee_bps: u16,
    pub treasury: Pubkey,
    pub total_races: u64,
}

impl Config {
    pub const LEN: usize = 1 + 32 + 2 + 32 + 8; // 75 bytes
}

#[account]
pub struct Race {
    pub bump: u8,
    pub vault_bump: u8,
    pub race_id: u64,
    pub authority: Pubkey,
    pub horse_name: String,
    pub question: String,
    pub yes_pool: u64,
    pub no_pool: u64,
    pub status: RaceStatus,
    pub result: Option<bool>,
    pub created_at: i64,
    pub settled_at: Option<i64>,
}

impl Race {
    pub const LEN: usize = 1 + 1 + 8 + 32 + (4 + 32) + (4 + 128) + 8 + 8 + 1 + 2 + 8 + 9; // 246 bytes
}

#[account]
pub struct Bet {
    pub bump: u8,
    pub race_id: u64,
    pub user: Pubkey,
    pub prediction: bool,
    pub amount: u64,
    pub claimed: bool,
    pub created_at: i64,
}

impl Bet {
    pub const LEN: usize = 1 + 8 + 32 + 1 + 8 + 1 + 8; // 59 bytes
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum RaceStatus {
    Upcoming,
    Live,
    Settled,
}

// ============== MAGICBLOCK ER ACCOUNTS ==============

/// Delegation context — delegates the Race account (program-owned) to the ER.
/// The vault (system-owned) stays on mainnet; only pool tracking goes to ER.
#[delegate]
#[derive(Accounts)]
pub struct DelegateRaceAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        del,
        seeds = [b"race", race.race_id.to_le_bytes().as_ref()],
        bump = race.bump,
        constraint = race.status == RaceStatus::Live @ ErrorCode::InvalidRaceStatus
    )]
    pub race: Account<'info, Race>,
}

/// Commit + undelegate context — commits race account state back from ER to mainnet.
#[commit]
#[derive(Accounts)]
pub struct CommitRaceAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"race", race.race_id.to_le_bytes().as_ref()],
        bump = race.bump
    )]
    pub race: Account<'info, Race>,
}

// Upgrade authority — the wallet that deployed/upgrades the program
const UPGRADE_AUTHORITY: Pubkey = pubkey!("3CagFPDrBbQ78RxzXNJE6ynC3q2SSmSnocARgbot4gSf");

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(constraint = upgrade_authority.key() == UPGRADE_AUTHORITY @ ErrorCode::Unauthorized)]
    pub upgrade_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferRaceAuthority<'info> {
    #[account(mut, seeds = [b"race", race.race_id.to_le_bytes().as_ref()], bump = race.bump)]
    pub race: Account<'info, Race>,
    #[account(constraint = upgrade_authority.key() == UPGRADE_AUTHORITY @ ErrorCode::Unauthorized)]
    pub upgrade_authority: Signer<'info>,
}

// ============== EVENTS ==============

#[event]
pub struct ConfigInitialized {
    pub authority: Pubkey,
    pub fee_bps: u16,
    pub treasury: Pubkey,
}

#[event]
pub struct RaceCreated {
    pub race_id: u64,
    pub horse_name: String,
    pub question: String,
    pub created_at: i64,
}

#[event]
pub struct BetPlaced {
    pub race_id: u64,
    pub user: Pubkey,
    pub prediction: bool,
    pub amount: u64,
    pub total_bet: u64,
}

#[event]
pub struct RaceStarted {
    pub race_id: u64,
    pub started_at: i64,
}

#[event]
pub struct RaceSettled {
    pub race_id: u64,
    pub result: bool,
    pub yes_pool: u64,
    pub no_pool: u64,
    pub settled_at: i64,
}

#[event]
pub struct WinningsClaimed {
    pub race_id: u64,
    pub user: Pubkey,
    pub payout: u64,
}

#[event]
pub struct LiveBettingStarted {
    pub race_id: u64,
    pub started_at: i64,
}

#[event]
pub struct LiveBettingEnded {
    pub race_id: u64,
    pub ended_at: i64,
}

// ============== ERRORS ==============

#[error_code]
pub enum ErrorCode {
    #[msg("Math overflow occurred")]
    MathOverflow,
    #[msg("Division by zero")]
    DivisionByZero,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Invalid fee (must be <= 10000 bps)")]
    InvalidFee,
    #[msg("Horse name too long (max 32 chars)")]
    HorseNameTooLong,
    #[msg("Question too long (max 128 chars)")]
    QuestionTooLong,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Race is not open for betting")]
    RaceNotOpen,
    #[msg("Invalid race status for this operation")]
    InvalidRaceStatus,
    #[msg("Race has not been settled yet")]
    RaceNotSettled,
    #[msg("Winnings already claimed")]
    AlreadyClaimed,
    #[msg("Bet did not win")]
    NotAWinner,
    #[msg("No winning pool")]
    NoWinningPool,
    #[msg("No payout available")]
    NoPayout,
    #[msg("Invalid treasury account")]
    InvalidTreasury,
}
