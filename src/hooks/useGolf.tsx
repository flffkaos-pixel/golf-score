import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../supabase';
import type { GolfData, Player, Round, Competition } from '../types';
import { loadData, generateId, createNewRound, calculateScore } from '../utils/storage';

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
  createCompetition: (name: string, friendIds?: string[]) => Promise<Competition>;
  joinCompetition: (compId: string, hostId?: string, compName?: string) => Promise<void>;
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

export const GolfProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<GolfData>(loadData);
  const [syncing, setSyncing] = useState(false);

  // Load friends from Supabase when user is available
  useEffect(() => {
    const loadRemoteData = async () => {
      setSyncing(true);
      try {
        // Load friendships
        const { data: friendships, error: fError } = await supabase
          .from('friendships')
          .select('*');
        
        if (!fError && friendships) {
          const remoteFriends: Player[] = friendships.map(f => ({
            id: f.friend_id,
            name: f.friend_name,
            userId: f.friend_id,
          }));
          
          setData(prev => ({
            ...prev,
            friends: remoteFriends,
          }));
        }

        // Load competitions where user is a participant
        const { data: competitions, error: cError } = await supabase
          .from('competitions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!cError && competitions) {
          const remoteCompetitions: Competition[] = competitions
            .map(c => ({
              id: c.id,
              name: c.name,
              hostId: c.host_id,
              hostName: c.host_name,
              players: (c.player_names || []).map((name: string, i: number) => ({
                id: c.player_ids?.[i] || `player_${i}`,
                name,
              })),
              playerIds: c.player_ids || [],
              rounds: [],
              startDate: c.start_date || c.created_at,
              endDate: c.end_date,
              status: c.status,
            }));

          // Load rounds for each competition
          for (const comp of remoteCompetitions) {
            const { data: rounds, error: rError } = await supabase
              .from('competition_rounds')
              .select('*')
              .eq('competition_id', comp.id);
            
            if (!rError && rounds) {
              comp.rounds = rounds.map(r => ({
                id: r.id,
                date: r.played_at,
                courseName: r.course_name,
                holes: r.holes,
                totalScore: r.total_score,
                totalPar: r.total_par,
                relativeScore: r.relative_score,
                competitionId: comp.id,
                playerId: r.player_id,
              }));
            }
          }

          setData(prev => ({
            ...prev,
            competitions: remoteCompetitions,
          }));
        }
      } catch (e) {
        console.error('Failed to load remote data:', e);
      } finally {
        setSyncing(false);
      }
    };

    loadRemoteData();
  }, []);

  // Realtime subscription for competitions
  useEffect(() => {
    const channel = supabase
      .channel('competitions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'competitions' },
        async (payload) => {
          console.log('Competition change:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const c = payload.new as any;
            const { data: rounds } = await supabase
              .from('competition_rounds')
              .select('*')
              .eq('competition_id', c.id);
            
            const compRounds = (rounds || []).map(r => ({
              id: r.id,
              date: r.played_at,
              courseName: r.course_name,
              holes: r.holes,
              totalScore: r.total_score,
              totalPar: r.total_par,
              relativeScore: r.relative_score,
              competitionId: c.id,
              playerId: r.player_id,
            }));

            setData(prev => {
              const existing = prev.competitions.findIndex(comp => comp.id === c.id);
              const compPlayers = (c.player_names || []).map((name: string, i: number) => ({
                id: c.player_ids?.[i] || `player_${i}`,
                name,
              }));
              
              const newComp: Competition = {
                id: c.id,
                name: c.name,
                hostId: c.host_id,
                hostName: c.host_name,
                players: compPlayers,
                playerIds: c.player_ids || [],
                rounds: compRounds,
                startDate: c.start_date || c.created_at,
                endDate: c.end_date,
                status: c.status,
              };

              const newComps = [...prev.competitions];
              if (existing >= 0) {
                newComps[existing] = { ...newComps[existing], ...newComp };
              } else {
                newComps.unshift(newComp);
              }
              
              return { ...prev, competitions: newComps };
            });
          } else if (payload.eventType === 'DELETE') {
            const compId = (payload.old as any).id;
            setData(prev => ({
              ...prev,
              competitions: prev.competitions.filter(c => c.id !== compId),
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'competition_rounds' },
        async (payload) => {
          console.log('Round change:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const r = payload.new as any;
            const compId = r.competition_id;
            
            setData(prev => ({
              ...prev,
              competitions: prev.competitions.map(c => {
                if (c.id !== compId) return c;
                
                const existingRoundIdx = c.rounds.findIndex(cr => cr.id === r.id);
                const newRound: Round = {
                  id: r.id,
                  date: r.played_at,
                  courseName: r.course_name,
                  holes: r.holes,
                  totalScore: r.total_score,
                  totalPar: r.total_par,
                  relativeScore: r.relative_score,
                  competitionId: compId,
                  playerId: r.player_id,
                };
                
                const newRounds = [...c.rounds];
                if (existingRoundIdx >= 0) {
                  newRounds[existingRoundIdx] = newRound;
                } else {
                  newRounds.push(newRound);
                }
                
                const playerIdsWithRounds = new Set(newRounds.map(cr => cr.playerId));
                const allFinished = c.players.every(p => playerIdsWithRounds.has(p.id));
                
                return { ...c, rounds: newRounds, status: allFinished ? 'finished' as const : 'active' as const };
              }),
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        async (payload) => {
          console.log('Friendship change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const f = payload.new as any;
            setData(prev => {
              const exists = prev.friends.some(fr => fr.id === f.friend_id);
              if (exists) return prev;
              return {
                ...prev,
                friends: [...prev.friends, { id: f.friend_id, name: f.friend_name, userId: f.friend_id }],
              };
            });
          } else if (payload.eventType === 'DELETE') {
            const friendId = (payload.old as any).friend_id;
            setData(prev => ({
              ...prev,
              friends: prev.friends.filter(f => f.id !== friendId),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      rounds: prev.rounds.map(r => r.id === round.id ? round : r),
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

  const addFriend = useCallback(async (name: string, userId?: string) => {
    const friendId = userId || generateId();
    
    // Add to local state immediately
    const newFriend: Player = { id: friendId, name, userId: friendId };
    setData(prev => {
      const exists = prev.friends.some(f => f.id === friendId);
      if (exists) return prev;
      return { ...prev, friends: [...prev.friends, newFriend] };
    });

    // Sync to Supabase
    try {
      const { data: userMeta } = await supabase.auth.getUser();
      const currentUserId = userMeta?.user?.id;
      if (!currentUserId) return;

      await supabase
        .from('friendships')
        .upsert({
          user_id: currentUserId,
          friend_id: friendId,
          friend_name: name,
        }, { onConflict: 'user_id,friend_id' });
    } catch (e) {
      console.error('Failed to sync friend:', e);
    }
  }, []);

  const removeFriend = useCallback(async (friendId: string) => {
    setData(prev => ({
      ...prev,
      friends: prev.friends.filter(f => f.id !== friendId),
    }));

    try {
      const { data: userMeta } = await supabase.auth.getUser();
      const currentUserId = userMeta?.user?.id;
      if (!currentUserId) return;

      await supabase
        .from('friendships')
        .delete()
        .eq('user_id', currentUserId)
        .eq('friend_id', friendId);
    } catch (e) {
      console.error('Failed to remove friend:', e);
    }
  }, []);

  const updateFriend = (friendId: string, name: string) => {
    setData(prev => ({
      ...prev,
      friends: prev.friends.map(f => 
        f.id === friendId ? { ...f, name } : f
      ),
    }));
  };

  const createCompetition = useCallback(async (name: string, friendIds: string[] = []): Promise<Competition> => {
    const { data: userMeta } = await supabase.auth.getUser();
    const currentUserId = userMeta?.user?.id;
    const currentUserName = data.player.name;

    const invitedFriends = data.friends.filter(f => friendIds.includes(f.id));
    const allPlayerIds = [currentUserId || data.player.id, ...invitedFriends.map(f => f.id)];
    const allPlayerNames = [currentUserName, ...invitedFriends.map(f => f.name)];

    const comp: Competition = {
      id: generateId(),
      name,
      hostId: currentUserId || data.player.id,
      hostName: currentUserName,
      players: [{ id: currentUserId || data.player.id, name: currentUserName }, ...invitedFriends],
      playerIds: allPlayerIds,
      rounds: [],
      startDate: new Date().toISOString(),
      status: 'pending',
    };
    
    setData(prev => ({
      ...prev,
      competitions: [...prev.competitions, comp],
    }));

    // Save to Supabase
    try {
      await supabase
        .from('competitions')
        .insert({
          id: comp.id,
          name: comp.name,
          host_id: comp.hostId,
          host_name: comp.hostName,
          player_ids: allPlayerIds,
          player_names: allPlayerNames,
          status: comp.status,
          start_date: comp.startDate,
        });
    } catch (e) {
      console.error('Failed to create competition in DB:', e);
    }
    
    return comp;
  }, [data.friends, data.player]);

  const joinCompetition = useCallback(async (_compId: string, _hostId?: string, _compName?: string) => {
    const { data: userMeta } = await supabase.auth.getUser();
    const currentUserId = userMeta?.user?.id;
    const currentUserName = data.player.name;

    setData(prev => {
      const existingComp = prev.competitions.find(c => c.id === _compId);
      
      if (existingComp) {
        if (!existingComp.players.find(p => p.id === currentUserId || p.id === data.player.id)) {
          const updatedComp = {
            ...existingComp,
            players: [...existingComp.players, { id: currentUserId || data.player.id, name: currentUserName }],
            playerIds: [...existingComp.playerIds, currentUserId || data.player.id],
          };
          
          return {
            ...prev,
            competitions: prev.competitions.map(c => 
              c.id === _compId ? updatedComp : c
            ),
          };
        }
        return prev;
      }
      return prev;
    });

    // Update in Supabase
    try {
      const { data: existingComp } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', _compId)
        .single();

      if (existingComp) {
        const playerIds = existingComp.player_ids || [];
        const playerNames = existingComp.player_names || [];
        
        if (!playerIds.includes(currentUserId || data.player.id)) {
          await supabase
            .from('competitions')
            .update({
              player_ids: [...playerIds, currentUserId || data.player.id],
              player_names: [...playerNames, currentUserName],
            })
            .eq('id', _compId);
        }
      }
    } catch (e) {
      console.error('Failed to join competition in DB:', e);
    }
  }, [data.player]);

  const deleteCompetition = useCallback(async (compId: string) => {
    setData(prev => ({
      ...prev,
      competitions: prev.competitions.filter(c => c.id !== compId),
    }));

    try {
      await supabase
        .from('competition_rounds')
        .delete()
        .eq('competition_id', compId);

      const { error } = await supabase
        .from('competitions')
        .delete()
        .eq('id', compId);
      
      if (error) {
        console.error('Supabase delete error:', error);
      }
    } catch (e) {
      console.error('Failed to delete competition:', e);
    }
  }, []);

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

  const finishCompetitionRound = useCallback(async (compId: string, round: Round, playerIds: string[]) => {
    setData(prev => {
      const competitions = prev.competitions.map(c => {
        if (c.id !== compId) return c;
        const updatedRounds = [...c.rounds, round];
        const playerIdsWithRounds = new Set(updatedRounds.map(r => r.playerId));
        const allFinished = playerIds.every(pid => playerIdsWithRounds.has(pid));
        return {
          ...c,
          rounds: updatedRounds,
          status: allFinished ? 'finished' as const : 'active' as const,
        };
      });
      return { ...prev, competitions };
    });

    // Save round to Supabase
    try {
      await supabase
        .from('competition_rounds')
        .insert({
          id: round.id,
          competition_id: compId,
          player_id: round.playerId,
          player_name: data.player.name,
          holes: round.holes,
          total_score: round.totalScore,
          total_par: round.totalPar,
          relative_score: round.relativeScore,
          course_name: round.courseName,
        });

      // Update competition status
      const comp = data.competitions.find(c => c.id === compId);
      if (comp) {
        const allRounds = [...comp.rounds, round];
        const playerIdsWithRounds = new Set(allRounds.map(r => r.playerId));
        const allFinished = comp.players.every(p => playerIdsWithRounds.has(p.id));
        
        await supabase
          .from('competitions')
          .update({
            status: allFinished ? 'finished' : 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', compId);
      }
    } catch (e) {
      console.error('Failed to save round:', e);
    }
  }, [data.competitions, data.player]);

  const addPlayerToCompetition = useCallback(async (compId: string, friendId: string) => {
    const friend = data.friends.find(f => f.id === friendId);
    if (!friend) return;
    
    setData(prev => ({
      ...prev,
      competitions: prev.competitions.map(c => 
        c.id === compId && !c.players.find(p => p.id === friendId)
          ? { ...c, players: [...c.players, friend], playerIds: [...c.playerIds, friendId] }
          : c
      ),
    }));

    // Update in Supabase
    try {
      const { data: existingComp } = await supabase
        .from('competitions')
        .select('player_ids, player_names')
        .eq('id', compId)
        .single();

      if (existingComp) {
        const playerIds = existingComp.player_ids || [];
        const playerNames = existingComp.player_names || [];
        
        if (!playerIds.includes(friendId)) {
          await supabase
            .from('competitions')
            .update({
              player_ids: [...playerIds, friendId],
              player_names: [...playerNames, friend.name],
            })
            .eq('id', compId);
        }
      }
    } catch (e) {
      console.error('Failed to add player to competition:', e);
    }
  }, [data.friends]);

  const addSampleData = () => {
    const sampleRounds = Array.from({ length: 8 }, () => {
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
    });
    
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
