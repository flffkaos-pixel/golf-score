import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { GolfData, Player, Round, Competition } from '../types';
import { loadData, saveData, generateId, createNewRound, calculateScore } from '../utils/storage';

interface GolfContextType {
  data: GolfData;
  setData: (data: GolfData | ((prev: GolfData) => GolfData)) => void;
  addRound: (courseName: string) => Round;
  updateRound: (round: Round) => void;
  deleteRound: (roundId: string) => void;
  updatePlayer: (player: Partial<Player>) => void;
  addFriend: (name: string, userId?: string) => void;
  removeFriend: (friendId: string) => void;
  updateFriend: (friendId: string, name: string) => void;
  createCompetition: (name: string, friendIds?: string[]) => Competition;
  joinCompetition: (compId: string, hostId?: string, compName?: string) => void;
  deleteCompetition: (compId: string) => void;
  addRoundToCompetition: (compId: string, round: Round) => void;
  finishCompetitionRound: (compId: string, round: Round, playerIds: string[]) => void;
  addPlayerToCompetition: (compId: string, friendId: string) => void;
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

  useEffect(() => {
    saveData(data);
  }, [data]);

  const addRound = (courseName: string): Round => {
    const newRound = createNewRound(courseName);
    const newData = {
      ...data,
      rounds: [newRound, ...data.rounds],
    };
    setData(newData);
    return newRound;
  };

  const updateRound = (round: Round) => {
    const newData = {
      ...data,
      rounds: data.rounds.map(r => r.id === round.id ? round : r),
    };
    setData(newData);
  };

  const deleteRound = (roundId: string) => {
    const newData = {
      ...data,
      rounds: data.rounds.filter(r => r.id !== roundId),
    };
    setData(newData);
  };

  const updatePlayer = (player: Partial<Player>) => {
    const newData = {
      ...data,
      player: { ...data.player, ...player },
    };
    setData(newData);
  };

  const addFriend = (name: string, userId?: string) => {
    const newFriend: Player = {
      id: generateId(),
      name,
      userId,
    };
    const newData = {
      ...data,
      friends: [...data.friends, newFriend],
    };
    setData(newData);
  };

  const removeFriend = (friendId: string) => {
    const newData = {
      ...data,
      friends: data.friends.filter(f => f.id !== friendId),
    };
    setData(newData);
  };

  const updateFriend = (friendId: string, name: string) => {
    setData(prev => ({
      ...prev,
      friends: prev.friends.map(f => 
        f.id === friendId ? { ...f, name } : f
      ),
    }));
  };

  const createCompetition = (name: string, friendIds: string[] = []): Competition => {
    const invitedFriends = data.friends.filter(f => friendIds.includes(f.id));
    const comp: Competition = {
      id: generateId(),
      name,
      hostId: data.player.id,
      hostName: data.player.name,
      players: [data.player, ...invitedFriends],
      playerIds: [data.player.id, ...invitedFriends.map(f => f.id)],
      rounds: [],
      startDate: new Date().toISOString(),
      status: 'pending',
    };
    
    const newData = {
      ...data,
      competitions: [...data.competitions, comp],
    };
    
    setData(newData);
    return comp;
  };

  const joinCompetition = (_compId: string, _hostId?: string, _compName?: string) => {
    const existingComp = data.competitions.find(c => c.id === _compId);
    
    if (existingComp) {
      if (!existingComp.players.find(p => p.id === data.player.id)) {
        const updatedComp = {
          ...existingComp,
          players: [...existingComp.players, data.player],
          playerIds: [...existingComp.playerIds, data.player.id],
        };
        
        const newData = {
          ...data,
          competitions: data.competitions.map(c => 
            c.id === _compId ? updatedComp : c
          ),
        };
        
        setData(newData);
      }
      return;
    }
  };

  const deleteCompetition = (compId: string) => {
    const newData = {
      ...data,
      competitions: data.competitions.filter(c => c.id !== compId),
    };
    setData(newData);
  };

  const addRoundToCompetition = (compId: string, round: Round) => {
    const newData = {
      ...data,
      competitions: data.competitions.map(c => 
        c.id === compId
          ? { ...c, rounds: [...c.rounds, round], status: 'active' as const }
          : c
      ),
    };
    setData(newData);
  };

  const finishCompetitionRound = (compId: string, round: Round, playerIds: string[]) => {
    const newData = {
      ...data,
      competitions: data.competitions.map(c => {
        if (c.id !== compId) return c;
        const updatedRounds = [...c.rounds, round];
        const playerIdsWithRounds = new Set(updatedRounds.map(r => r.playerId));
        const allFinished = playerIds.every(pid => playerIdsWithRounds.has(pid));
        return {
          ...c,
          rounds: updatedRounds,
          status: allFinished ? 'finished' as const : 'active' as const,
        };
      }),
    };
    setData(newData);
  };

  const addPlayerToCompetition = (compId: string, friendId: string) => {
    const friend = data.friends.find(f => f.id === friendId);
    if (!friend) return;
    
    const newData = {
      ...data,
      competitions: data.competitions.map(c => 
        c.id === compId && !c.players.find(p => p.id === friendId)
          ? { ...c, players: [...c.players, friend], playerIds: [...c.playerIds, friendId] }
          : c
      ),
    };
    setData(newData);
  };

  const addSampleData = () => {
    const sampleRounds = Array.from({ length: 8 }, generateSampleRound);
    const sampleFriends = ['김철수', '이영희', '박민수', '정수진'].map(name => ({
      id: generateId(),
      name,
    }));
    
    const newData = {
      ...data,
      rounds: [...sampleRounds, ...data.rounds],
      friends: [...data.friends, ...sampleFriends],
    };
    setData(newData);
  };

  const clearAllData = () => {
    if (confirm('모든 데이터가 삭제됩니다. 계속할까요?')) {
      localStorage.removeItem('golf_score_data');
      setData(loadData());
    }
  };

  const clearLocalData = () => {
    localStorage.removeItem('golf_score_data');
    setData(loadData());
  };

  return (
    <GolfContext.Provider value={{
      data,
      setData,
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
      finishCompetitionRound,
      addPlayerToCompetition,
      addSampleData,
      clearAllData,
      clearLocalData,
      syncing: false,
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
