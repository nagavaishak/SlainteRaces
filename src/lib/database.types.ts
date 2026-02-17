export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bets: {
        Row: {
          amount: number
          claim_signature: string | null
          claimed: boolean | null
          created_at: string | null
          id: string
          onchain_race_id: number | null
          payout: number | null
          prediction: string
          race_id: string | null
          status: string | null
          tx_signature: string | null
          user_wallet: string
        }
        Insert: {
          amount: number
          claim_signature?: string | null
          claimed?: boolean | null
          created_at?: string | null
          id?: string
          onchain_race_id?: number | null
          payout?: number | null
          prediction: string
          race_id?: string | null
          status?: string | null
          tx_signature?: string | null
          user_wallet: string
        }
        Update: {
          amount?: number
          claim_signature?: string | null
          claimed?: boolean | null
          created_at?: string | null
          id?: string
          onchain_race_id?: number | null
          payout?: number | null
          prediction?: string
          race_id?: string | null
          status?: string | null
          tx_signature?: string | null
          user_wallet?: string
        }
        Relationships: [
          {
            foreignKeyName: "bets_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      races: {
        Row: {
          blinks_url: string | null
          created_at: string | null
          horse_name: string
          id: string
          no_pool: number | null
          onchain_race_id: number | null
          program_id: string | null
          question: string
          race_pda: string | null
          race_time: string
          result: string | null
          settled_at: string | null
          status: string | null
          track_name: string
          updated_at: string | null
          vault_pda: string | null
          yes_pool: number | null
        }
        Insert: {
          blinks_url?: string | null
          created_at?: string | null
          horse_name: string
          id?: string
          no_pool?: number | null
          onchain_race_id?: number | null
          program_id?: string | null
          question: string
          race_pda?: string | null
          race_time: string
          result?: string | null
          settled_at?: string | null
          status?: string | null
          track_name: string
          updated_at?: string | null
          vault_pda?: string | null
          yes_pool?: number | null
        }
        Update: {
          blinks_url?: string | null
          created_at?: string | null
          horse_name?: string
          id?: string
          no_pool?: number | null
          onchain_race_id?: number | null
          program_id?: string | null
          question?: string
          race_pda?: string | null
          race_time?: string
          result?: string | null
          settled_at?: string | null
          status?: string | null
          track_name?: string
          updated_at?: string | null
          vault_pda?: string | null
          yes_pool?: number | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          total_bets: number | null
          total_wagered: number | null
          total_winnings: number | null
          updated_at: string | null
          wallet_address: string
          win_count: number | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          total_bets?: number | null
          total_wagered?: number | null
          total_winnings?: number | null
          updated_at?: string | null
          wallet_address: string
          win_count?: number | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          total_bets?: number | null
          total_wagered?: number | null
          total_winnings?: number | null
          updated_at?: string | null
          wallet_address?: string
          win_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          display_name: string | null
          rank: number | null
          total_bets: number | null
          total_winnings: number | null
          wallet_address: string | null
          win_count: number | null
          win_rate: number | null
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: {
      bet_prediction: "yes" | "no"
      bet_status: "active" | "won" | "lost"
      race_status: "upcoming" | "live" | "settled"
    }
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
