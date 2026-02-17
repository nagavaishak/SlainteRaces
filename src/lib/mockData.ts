export interface Race {
  id: string;
  trackName: string;
  raceTime: string;
  horseName: string;
  question: string;
  yesPool: number;
  noPool: number;
  status: 'upcoming' | 'live' | 'settled';
  result?: 'yes' | 'no';
  blinksUrl: string;
}

export interface Bet {
  id: string;
  raceId: string;
  horseName: string;
  trackName: string;
  prediction: 'yes' | 'no';
  amount: number;
  timestamp: Date;
  status: 'active' | 'won' | 'lost';
  payout?: number;
}

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  displayName: string;
  totalWinnings: number;
  totalBets: number;
  winRate: number;
}

export const mockRaces: Race[] = [
  {
    id: 'race-1',
    trackName: 'Leopardstown',
    raceTime: '3:15 PM',
    horseName: 'Fastnet Rock',
    question: 'Will Fastnet Rock finish top 3?',
    yesPool: 2450,
    noPool: 1820,
    status: 'live',
    blinksUrl: 'https://dial.to/action?ref=slainte-races&race=1'
  },
  {
    id: 'race-2',
    trackName: 'Curragh',
    raceTime: '4:30 PM',
    horseName: 'Tiger Roll',
    question: 'Will Tiger Roll finish top 3?',
    yesPool: 3200,
    noPool: 2100,
    status: 'upcoming',
    blinksUrl: 'https://dial.to/action?ref=slainte-races&race=2'
  },
  {
    id: 'race-3',
    trackName: 'Punchestown',
    raceTime: '5:45 PM',
    horseName: 'Ruby Walsh',
    question: 'Will Ruby Walsh finish top 3?',
    yesPool: 1890,
    noPool: 2340,
    status: 'upcoming',
    blinksUrl: 'https://dial.to/action?ref=slainte-races&race=3'
  }
];

export const mockUserBets: Bet[] = [
  {
    id: 'bet-1',
    raceId: 'race-1',
    horseName: 'Fastnet Rock',
    trackName: 'Leopardstown',
    prediction: 'yes',
    amount: 20,
    timestamp: new Date(Date.now() - 3600000),
    status: 'active'
  },
  {
    id: 'bet-2',
    raceId: 'race-4',
    horseName: 'Sea The Stars',
    trackName: 'Galway',
    prediction: 'no',
    amount: 10,
    timestamp: new Date(Date.now() - 86400000),
    status: 'won',
    payout: 18.50
  },
  {
    id: 'bet-3',
    raceId: 'race-5',
    horseName: 'Istabraq',
    trackName: 'Cheltenham',
    prediction: 'yes',
    amount: 5,
    timestamp: new Date(Date.now() - 172800000),
    status: 'lost'
  }
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, walletAddress: '7nYB...4kFm', displayName: 'LuckyPaddy', totalWinnings: 1247.50, totalBets: 45, winRate: 68 },
  { rank: 2, walletAddress: '3xKm...9pLq', displayName: 'GreenGambler', totalWinnings: 982.30, totalBets: 38, winRate: 62 },
  { rank: 3, walletAddress: '9hTn...2wRs', displayName: 'DublinDan', totalWinnings: 756.80, totalBets: 52, winRate: 55 },
  { rank: 4, walletAddress: '5mPq...8vXy', displayName: 'CorkChamp', totalWinnings: 623.40, totalBets: 29, winRate: 58 },
  { rank: 5, walletAddress: '2bNr...6tKz', displayName: 'GalwayGuru', totalWinnings: 541.20, totalBets: 41, winRate: 51 },
  { rank: 6, walletAddress: '8jLs...3wMp', displayName: 'KerryKing', totalWinnings: 489.60, totalBets: 33, winRate: 54 },
  { rank: 7, walletAddress: '4cQw...7yBn', displayName: 'MayoMaster', totalWinnings: 412.30, totalBets: 27, winRate: 52 },
  { rank: 8, walletAddress: '6fRt...1xDk', displayName: 'WexfordWiz', totalWinnings: 378.90, totalBets: 36, winRate: 47 },
  { rank: 9, walletAddress: '1aHv...5pLm', displayName: 'SligoStar', totalWinnings: 321.50, totalBets: 24, winRate: 50 },
  { rank: 10, walletAddress: '9dWx...4qNr', displayName: 'TippTop', totalWinnings: 287.20, totalBets: 31, winRate: 45 }
];

export const mockUserStats = {
  totalBets: 12,
  activeBets: 3,
  totalWinnings: 156.80,
  winRate: 58,
  eurcBalance: 245.50
};
