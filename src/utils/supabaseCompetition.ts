import { supabase } from '../supabase';
import type { Round, Competition, Player } from '../types';

export interface CompetitionRoundRecord {
  id: string;
  competition_id: string;
  player_id: string;
  player_name: string;
  holes: any[];
  total_score: number;
  total_par: number;
  relative_score: number;
  course_name: string;
  played_at: string;
}

export interface CompetitionWithRounds {
  id: string;
  name: string;
  host_id: string;
  host_name: string;
  player_ids: string[];
  status: string;
  start_date: string;
  rounds: CompetitionRoundRecord[];
}

export const saveCompetitionRoundToSupabase = async (
  competitionId: string,
  round: Round,
  playerName: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.from('competition_rounds').upsert({
      competition_id: competitionId,
      player_id: round.playerId || '',
      player_name: playerName,
      holes: round.holes,
      total_score: round.totalScore,
      total_par: round.totalPar,
      relative_score: round.relativeScore,
      course_name: round.courseName,
    }, { onConflict: 'competition_id,player_id' });

    if (error) {
      console.error('Error saving competition round:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error saving competition round:', error);
    return false;
  }
};

export const fetchCompetitionRounds = async (
  competitionId: string
): Promise<CompetitionRoundRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('competition_rounds')
      .select('*')
      .eq('competition_id', competitionId)
      .order('relative_score', { ascending: true });

    if (error) {
      console.error('Error fetching competition rounds:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching competition rounds:', error);
    return [];
  }
};

export const fetchAllCompetitionsFromSupabase = async (): Promise<CompetitionWithRounds[]> => {
  try {
    const { data: competitions, error: compError } = await supabase
      .from('competitions')
      .select('*');

    if (compError) {
      console.error('Error fetching competitions:', compError);
      return [];
    }

    const competitionsWithRounds: CompetitionWithRounds[] = [];

    for (const comp of competitions || []) {
      const { data: rounds } = await supabase
        .from('competition_rounds')
        .select('*')
        .eq('competition_id', comp.id)
        .order('relative_score', { ascending: true });

      competitionsWithRounds.push({
        ...comp,
        rounds: rounds || [],
      });
    }

    return competitionsWithRounds;
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return [];
  }
};

export const saveCompetitionToSupabase = async (
  comp: Competition
): Promise<boolean> => {
  try {
    const { error } = await supabase.from('competitions').upsert({
      id: comp.id,
      name: comp.name,
      host_id: comp.hostId,
      host_name: comp.hostName,
      player_ids: comp.playerIds,
      status: comp.status,
      start_date: comp.startDate,
    }, { onConflict: 'id' });

    if (error) {
      console.error('Error saving competition:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error saving competition:', error);
    return false;
  }
};

export const getRankingsForCompetition = (
  rounds: CompetitionRoundRecord[],
  players: Player[]
): { rank: number; player: Player | undefined; score: number; relative: number; playerName: string }[] => {
  const sorted = [...rounds].sort((a, b) => a.relative_score - b.relative_score);
  return sorted.map((round, index) => ({
    rank: index + 1,
    player: players.find(p => p.id === round.player_id),
    score: round.total_score,
    relative: round.relative_score,
    playerName: round.player_name,
  }));
};
