import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { GolfData, Player, Round, Competition } from '../types';
import { loadData, saveData, generateId, createNewRound, calculateScore } from '../utils/storage';

interface GolfContextType {
  data: GolfData;
  addRound: (courseName: string) => Round;
  updateRound: (round: Round) => void;
  deleteRound: (roundId: string) => void;
  updatePlayer: (player: Partial<Player>) => void;
  addFriend: (name: string) => void;
  removeFriend: (friendId: string) => void;
  createCompetition: (name: string) => Competition;
  joinCompetition: (compId: string) => void;
  addRoundToCompetition: (compId: string, round: Round) => void;
  addSampleData: () => void;
  clearAllData: () => void;
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

  const createCompetition = (name: string): Competition => {
    const comp: Competition = {
      id: generateId(),
      name,
      hostId: data.player.id,
      players: [data.player],
      rounds: [],
      startDate: new Date().toISOString(),
      status: 'pending',
    };
    setData(prev => ({
      ...prev,
      competitions: [...prev.competitions, comp],
    }));
    return comp;
  };

  const joinCompetition = (compId: string) => {
    setData(prev => ({
      ...prev,
      competitions: prev.competitions.map(c => 
        c.id === compId && !c.players.find(p => p.id === data.player.id)
          ? { ...c, players: [...c.players, data.player] }
          : c
      ),
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

  const clearAllData = () => {
    if (confirm('모든 데이터가 삭제됩니다. 계속할까요?')) {
      localStorage.removeItem('golf_score_data');
      setData(loadData());
      window.location.reload();
    }
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
      createCompetition,
      joinCompetition,
      addRoundToCompetition,
      addSampleData,
      clearAllData,
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
