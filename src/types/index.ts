export interface Hole {
  number: number;
  par: number;
  score: number | null;
}

export interface Round {
  id: string;
  date: string;
  courseName: string;
  holes: Hole[];
  totalScore: number;
  totalPar: number;
  relativeScore: number;
  competitionId?: string;
  playerId?: string;
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  userId?: string;
}

export interface Competition {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  players: Player[];
  playerIds: string[];
  rounds: Round[];
  startDate: string;
  endDate?: string;
  status: 'pending' | 'active' | 'finished';
}

export interface GolfData {
  player: Player;
  rounds: Round[];
  friends: Player[];
  competitions: Competition[];
}
