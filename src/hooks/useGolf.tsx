import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { GolfData, Player, Round, Competition } from '../types';
import { loadData, saveData, generateId, createNewRound, calculateScore } from '../utils/storage';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

interface GolfContextType {
  data: GolfData;
  addRound: (courseName: string) => Round;
  updateRound: (round: Round) => void;
  deleteRound: (roundId: string) => void;
  updatePlayer: (player: Partial<Player>) => void;
  addFriend: (name: string) => void;
  removeFriend: (friendId: string) => void;
  updateFriend: (friendId: string, name: string) => void;
  createCompetition: (name: string) => Competition;
  joinCompetition: (compId: string) => void;
  deleteCompetition: (compId: string) => void;
  addRoundToCompetition: (compId: string, round: Round) => void;
  addSampleData: () => void;
  clearAllData: () => void;
  clearLocalData: () => void;
  syncing: boolean;
}

const GolfContext = createContext<GolfContextType | null>(null);

const courseNames = ['하늘CC', 'ocean 파크', '숲속高尔夫', 'lakeサイド', 'sunsetCC', '마운틴View', '바다RESORT', '골든밸리'];

const generateSampleRound = () => {
  const holes = Array.from({ length: 18 }, (_, i) => {
    const parOptions = [3, 4, 4, 5];
    const par = parOptions[Math.floor(Math.random() * parOptions.length)];
    const baseScore = par + Math.floor(Math.random() * 5) - 2;
    const score = Math.max(1, Math.min(baseScore, 15));
    return { number: i + 1, par, score };
  });
  
  const { totalScore, totalPar, relativeScore } = calculateScore(holes);
  const daysAgo = Math.floor(Math.random() * 60);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  
  return {
    id: generateId(),
    date: date.toISOString(),
    courseName: courseNames[Math.floor(Math.random() * courseNames.length)],
    holes,
    totalScore,
    totalPar,
    relativeScore,
  };
};

export const GolfProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<GolfData>(loadData);
  const [syncing, setSyncing] = useState(false);
  const { user } = useAuth();

  const syncToSupabase = async (golfData: GolfData) => {
    if (!user) return;
    setSyncing(true);
    try {
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: user.id,
          data: golfData,
          updated_at: new Date().toISOString(),
        });
      if (error) console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const syncCompetitionToSupabase = async (comp: Competition) => {
    try {
      await supabase
        .from('shared_competitions')
        .upsert({
          id: comp.id,
          name: comp.name,
          host_id: comp.hostId,
          host_name: comp.hostName,
          players: comp.players,
          player_ids: comp.playerIds,
          rounds: comp.rounds,
          start_date: comp.startDate,
          status: comp.status,
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Sync competition error:', error);
    }
  };

  const loadSharedCompetitions = async () => {
    if (!user || data.friends.length === 0) return;
    
    try {
      const friendIds = data.friends.map(f => f.id);
      const allIds = [user.id, ...friendIds];
      
      const { data: sharedComps, error } = await supabase
        .from('shared_competitions')
        .select('*')
        .overlaps('player_ids', allIds);
      
      if (error) {
        console.error('Load shared competitions error:', error);
        return;
      }
      
      if (sharedComps) {
        const remoteComps: Competition[] = sharedComps.map(c => ({
          id: c.id,
          name: c.name,
          hostId: c.host_id,
          hostName: c.host_name,
          players: c.players,
          playerIds: c.player_ids,
          rounds: c.rounds,
          startDate: c.start_date,
          status: c.status,
        }));
        
        setData(prev => {
          const localCompIds = new Set(prev.competitions.map(c => c.id));
          const newRemoteComps = remoteComps.filter(c => !localCompIds.has(c.id));
          return {
            ...prev,
            competitions: [...prev.competitions, ...newRemoteComps],
          };
        });
      }
    } catch (error) {
      console.error('Load shared competitions error:', error);
    }
  };

  const loadFromSupabase = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const { data: supabaseData, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Load error:', error);
        return;
      }
      
      if (supabaseData?.data) {
        setData(supabaseData.data);
        saveData(supabaseData.data);
      }
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadFromSupabase();
    }
  }, [user]);

  useEffect(() => {
    loadSharedCompetitions();
  }, [user, data.friends]);

  useEffect(() => {
    if (user && data) {
      syncToSupabase(data);
    }
    saveData(data);
  }, [data, user]);

  const addRound = (courseName: string): Round => {
    const newRound = createNewRound(courseName);
    setData(prev => ({
      ...prev,
      rounds: [newRound, ...prev.rounds],
    }));
    return newRound;
  };

  const updateRound = (round: Round) => {
    setData(prev => ({
      ...prev,
      rounds: prev.rounds.map(r => 
        r.id === round.id ? round : r
      ),
    }));
  };

  const deleteRound = (roundId: string) => {
    setData(prev => ({
      ...prev,
      rounds: prev.rounds.filter(r => r.id !== roundId),
    }));
  };

  const updatePlayer = (player: Partial<Player>) => {
    setData(prev => ({
      ...prev,
      player: { ...prev.player, ...player },
    }));
  };

  const addFriend = (name: string) => {
    const newFriend: Player = {
      id: generateId(),
      name,
    };
    setData(prev => ({
      ...prev,
      friends: [...prev.friends, newFriend],
    }));
  };

  const removeFriend = (friendId: string) => {
    setData(prev => ({
      ...prev,
      friends: prev.friends.filter(f => f.id !== friendId),
    }));
  };

  const updateFriend = (friendId: string, name: string) => {
    setData(prev => ({
      ...prev,
      friends: prev.friends.map(f => 
        f.id === friendId ? { ...f, name } : f
      ),
    }));
  };

  const createCompetition = (name: string): Competition => {
    const comp: Competition = {
      id: generateId(),
      name,
      hostId: data.player.id,
      hostName: data.player.name,
      players: [data.player],
      playerIds: [data.player.id],
      rounds: [],
      startDate: new Date().toISOString(),
      status: 'pending',
    };
    
    setData(prev => ({
      ...prev,
      competitions: [...prev.competitions, comp],
    }));
    
    syncCompetitionToSupabase(comp);
    return comp;
  };

  const joinCompetition = (compId: string) => {
    setData(prev => ({
      ...prev,
      competitions: prev.competitions.map(c => 
        c.id === compId && !c.players.find(p => p.id === data.player.id)
          ? { 
              ...c, 
              players: [...c.players, data.player],
              playerIds: [...c.playerIds, data.player.id]
            }
          : c
      ),
    }));
    
    const comp = data.competitions.find(c => c.id === compId);
    if (comp) {
      const updatedComp = {
        ...comp,
        players: [...comp.players, data.player],
        playerIds: [...comp.playerIds, data.player.id],
      };
      syncCompetitionToSupabase(updatedComp);
    }
  };

  const deleteCompetition = (compId: string) => {
    setData(prev => ({
      ...prev,
      competitions: prev.competitions.filter(c => c.id !== compId),
    }));
  };

  const addRoundToCompetition = (compId: string, round: Round) => {
    setData(prev => ({
      ...prev,
      competitions: prev.competitions.map(c => 
        c.id === compId
          ? { ...c, rounds: [...c.rounds, round], status: 'active' as const }
          : c
      ),
    }));
  };

  const addSampleData = () => {
    const sampleRounds = Array.from({ length: 8 }, generateSampleRound);
    const sampleFriends = ['김철수', '이영희', '박민수', '정수진'].map(name => ({
      id: generateId(),
      name,
    }));
    
    setData(prev => ({
      ...prev,
      rounds: [...sampleRounds, ...prev.rounds],
      friends: [...prev.friends, ...sampleFriends],
    }));
  };

  const clearAllData = async () => {
    if (confirm('모든 데이터가 삭제됩니다. 계속할까요?')) {
      const newData = loadData();
      setData(newData);
      if (user) {
        await supabase
          .from('user_data')
          .delete()
          .eq('user_id', user.id);
      }
      localStorage.removeItem('golf_score_data');
    }
  };

  const clearLocalData = () => {
    localStorage.removeItem('golf_score_data');
    setData(loadData());
  };

  return (
    <GolfContext.Provider value={{
      data,
      addRound,
      updateRound,
      deleteRound,
      updatePlayer,
      addFriend,
      removeFriend,
      updateFriend,
      createCompetition,
      joinCompetition,
      deleteCompetition,
      addRoundToCompetition,
      addSampleData,
      clearAllData,
      clearLocalData,
      syncing,
    }}>
      {children}
    </GolfContext.Provider>
  );
};

export const useGolf = () => {
  const context = useContext(GolfContext);
  if (!context) {
    throw new Error('useGolf must be used within GolfProvider');
  }
  return context;
};
