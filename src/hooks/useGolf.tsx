import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { GolfData, Player, Round, Competition } from '../types';
import { loadData, saveData, generateId, createNewRound } from '../utils/storage';

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
}

const GolfContext = createContext<GolfContextType | null>(null);

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
