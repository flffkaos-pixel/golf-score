import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '../supabase';
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
  createCompetition: (name: string, friendIds?: string[]) => Promise<Competition>;
  joinCompetition: (compId: string, hostId?: string, compName?: string) => Promise<void>;
  deleteCompetition: (compId: string) => Promise<void>;
  addRoundToCompetition: (compId: string, round: Round) => void;
  finishCompetitionRound: (compId: string, round: Round, playerIds: string[]) => Promise<void>;
  addPlayerToCompetition: (compId: string, friendId: string) => Promise<void>;
  addSampleData: () => void;
  clearAllData: () => void;
  clearLocalData: () => void;
  syncing: boolean;
}

const GolfContext = createContext<GolfContextType | null>(null);

const courseNames = ['하늘CC', 'ocean 파크', '숲속高尔夫', 'lakeサイド', 'sunsetCC', '마운틴View', '바다RESORT', '골든밸리'];

function mapDbCompToComp(c: any, rounds: any[] = []): Competition {
  return {
    id: c.id,
    name: c.name,
    hostId: c.host_id,
    hostName: c.host_name,
    players: (c.player_names || []).map((name: string, i: number) => ({
      id: c.player_ids?.[i] || `player_${i}`,
      name,
    })),
    playerIds: c.player_ids || [],
    rounds: rounds.map((r: any) => ({
      id: r.id,
      date: r.played_at,
      courseName: r.course_name,
      holes: r.holes,
      totalScore: r.total_score,
      totalPar: r.total_par,
      relativeScore: r.relative_score,
      competitionId: r.competition_id,
      playerId: r.player_id,
    })),
    startDate: c.start_date || c.created_at,
    endDate: c.end_date,
    status: c.status,
  };
}

export const GolfProvider = ({ children }: { children: ReactNode }) => {
  const localData = loadData();
  const [data, setData] = useState<GolfData>(localData);
  const [syncing, setSyncing] = useState(true);
  const isInitialLoadDone = useRef(false);
  const ownUserId = useRef<string | null>(null);

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      ownUserId.current = user?.id || null;
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      ownUserId.current = session?.user?.id || null;
    });
    return () => subscription.unsubscribe();
  }, []);

  // Initial load from Supabase — wait for auth
  useEffect(() => {
    const uid = ownUserId.current;
    if (!uid) return;

    let cancelled = false;
    const loadAll = async () => {
      setSyncing(true);
      try {
        // Load friends
        const { data: friendships } = await supabase
          .from('friendships')
          .select('*')
          .eq('user_id', uid);
        
        if (friendships && !cancelled) {
          const remoteFriends: Player[] = friendships.map(f => ({
            id: f.friend_id,
            name: f.friend_name,
            userId: f.friend_id,
          }));
          setData(prev => ({ ...prev, friends: remoteFriends }));
        }

        // Load competitions
        const { data: comps } = await supabase
          .from('competitions')
          .select('*')
          .or(`player_ids.cs.{${uid}},host_id.eq.${uid}`)
          .order('created_at', { ascending: false });

        if (comps && comps.length > 0 && !cancelled) {
          const compIds = comps.map(c => c.id);
          const { data: allRounds } = await supabase
            .from('competition_rounds')
            .select('*')
            .in('competition_id', compIds);

          const remoteComps: Competition[] = comps.map(c => {
            const compRounds = (allRounds || []).filter(r => r.competition_id === c.id);
            return mapDbCompToComp(c, compRounds);
          });

          setData(prev => ({ ...prev, competitions: remoteComps }));
        }
      } catch (e) {
        console.error('Initial load error:', e);
      } finally {
        if (!cancelled) {
          setSyncing(false);
          isInitialLoadDone.current = true;
        }
      }
    };

    loadAll();
    return () => { cancelled = true; };
  }, [ownUserId.current]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('golf-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'competitions' },
        async (payload) => {
          const c = payload.new as any;
          const uid = ownUserId.current;
          // Only add if current user is a participant
          if (uid && c.player_ids && !c.player_ids.includes(uid) && c.host_id !== uid) return;
          
          const { data: rounds } = await supabase
            .from('competition_rounds')
            .select('*')
            .eq('competition_id', c.id);
          
          const newComp = mapDbCompToComp(c, rounds || []);
          setData(prev => {
            if (prev.competitions.some(x => x.id === newComp.id)) return prev;
            return { ...prev, competitions: [...prev.competitions, newComp] };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'competitions' },
        async (payload) => {
          const c = payload.new as any;
          setData(prev => {
            // Only update if we already have this competition locally
            if (!prev.competitions.some(x => x.id === c.id)) return prev;
            return prev; // Will be updated by rounds subscription
          });
          
          const { data: rounds } = await supabase
            .from('competition_rounds')
            .select('*')
            .eq('competition_id', c.id);
          
          const updatedComp = mapDbCompToComp(c, rounds || []);
          setData(prev => ({
            ...prev,
            competitions: prev.competitions.map(x => x.id === updatedComp.id ? updatedComp : x),
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'competitions' },
        (payload) => {
          const compId = (payload.old as any).id;
          setData(prev => ({
            ...prev,
            competitions: prev.competitions.filter(c => c.id !== compId),
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'competition_rounds' },
        (payload) => {
          const r = payload.new as any;
          setData(prev => ({
            ...prev,
            competitions: prev.competitions.map(c => {
              if (c.id !== r.competition_id) return c;
              const exists = c.rounds.some(x => x.id === r.id);
              if (exists) return c;
              const newRound: Round = {
                id: r.id,
                date: r.played_at,
                courseName: r.course_name,
                holes: r.holes,
                totalScore: r.total_score,
                totalPar: r.total_par,
                relativeScore: r.relative_score,
                competitionId: r.competition_id,
                playerId: r.player_id,
              };
              const newRounds = [...c.rounds, newRound];
              const playersWithRounds = new Set(newRounds.map(x => x.playerId));
              const allDone = c.players.every(p => playersWithRounds.has(p.id));
              return { ...c, rounds: newRounds, status: allDone ? 'finished' as const : 'active' as const };
            }),
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'competition_rounds' },
        (payload) => {
          const r = payload.new as any;
          setData(prev => ({
            ...prev,
            competitions: prev.competitions.map(c => {
              if (c.id !== r.competition_id) return c;
              const idx = c.rounds.findIndex(x => x.id === r.id);
              if (idx < 0) return c;
              const updatedRound: Round = {
                id: r.id,
                date: r.played_at,
                courseName: r.course_name,
                holes: r.holes,
                totalScore: r.total_score,
                totalPar: r.total_par,
                relativeScore: r.relative_score,
                competitionId: r.competition_id,
                playerId: r.player_id,
              };
              const newRounds = [...c.rounds];
              newRounds[idx] = updatedRound;
              return { ...c, rounds: newRounds };
            }),
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'friendships' },
        (payload) => {
          const f = payload.new as any;
          setData(prev => {
            if (prev.friends.some(x => x.id === f.friend_id)) return prev;
            return {
              ...prev,
              friends: [...prev.friends, { id: f.friend_id, name: f.friend_name, userId: f.friend_id }],
            };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'friendships' },
        (payload) => {
          const friendId = (payload.old as any).friend_id;
          setData(prev => ({
            ...prev,
            friends: prev.friends.filter(f => f.id !== friendId),
          }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Save local data (rounds, player) to localStorage
  useEffect(() => {
    saveData(data);
  }, [data.rounds, data.player]);

  const addRound = (courseName: string): Round => {
    const newRound = createNewRound(courseName);
    setData(prev => ({ ...prev, rounds: [newRound, ...prev.rounds] }));
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
    setData(prev => ({ ...prev, player: { ...prev.player, ...player } }));
  };

  const addFriend = useCallback(async (name: string, userId?: string) => {
    const friendId = userId || generateId();
    
    setData(prev => {
      if (prev.friends.some(f => f.id === friendId)) return prev;
      return { ...prev, friends: [...prev.friends, { id: friendId, name, userId: friendId }] };
    });

    try {
      const uid = ownUserId.current;
      if (!uid) return;
      await supabase.from('friendships').upsert(
        { user_id: uid, friend_id: friendId, friend_name: name },
        { onConflict: 'user_id,friend_id' }
      );
    } catch (e) {
      console.error('Friend sync error:', e);
    }
  }, []);

  const removeFriend = useCallback(async (friendId: string) => {
    setData(prev => ({ ...prev, friends: prev.friends.filter(f => f.id !== friendId) }));
    try {
      const uid = ownUserId.current;
      if (!uid) return;
      await supabase.from('friendships').delete().eq('user_id', uid).eq('friend_id', friendId);
    } catch (e) {
      console.error('Remove friend error:', e);
    }
  }, []);

  const updateFriend = (friendId: string, name: string) => {
    setData(prev => ({
      ...prev,
      friends: prev.friends.map(f => f.id === friendId ? { ...f, name } : f),
    }));
  };

  const createCompetition = useCallback(async (name: string, friendIds: string[] = []): Promise<Competition> => {
    const uid = ownUserId.current;
    const hostId = uid || data.player.id;
    const hostName = data.player.name;

    const invitedFriends = data.friends.filter(f => friendIds.includes(f.id));
    const allPlayerIds = [hostId, ...invitedFriends.map(f => f.userId || f.id)];
    const allPlayerNames = [hostName, ...invitedFriends.map(f => f.name)];

    const compId = generateId();
    const comp: Competition = {
      id: compId,
      name,
      hostId,
      hostName,
      players: [
        { id: hostId, name: hostName },
        ...invitedFriends.map(f => ({ id: f.userId || f.id, name: f.name })),
      ],
      playerIds: allPlayerIds,
      rounds: [],
      startDate: new Date().toISOString(),
      status: 'pending',
    };

    // Add to local state immediately
    setData(prev => ({ ...prev, competitions: [...prev.competitions, comp] }));

    // Save to Supabase
    try {
      const { error } = await supabase.from('competitions').insert({
        id: compId,
        name,
        host_id: hostId,
        host_name: hostName,
        player_ids: allPlayerIds,
        player_names: allPlayerNames,
        status: 'pending',
        start_date: comp.startDate,
      });
      if (error) console.error('Competition insert error:', error);
    } catch (e) {
      console.error('Competition save error:', e);
    }

    return comp;
  }, [data.friends, data.player]);

  const joinCompetition = useCallback(async (compId: string, hostId?: string, compName?: string) => {
    const uid = ownUserId.current;
    const playerId = uid || data.player.id;
    const playerName = data.player.name;

    // Update local state immediately
    setData(prev => {
      const existing = prev.competitions.find(c => c.id === compId);
      if (existing) {
        if (existing.players.some(p => p.id === playerId)) return prev;
        return {
          ...prev,
          competitions: prev.competitions.map(c =>
            c.id === compId
              ? { ...c, players: [...c.players, { id: playerId, name: playerName }], playerIds: [...c.playerIds, playerId] }
              : c
          ),
        };
      }
      // Competition not in local state yet — add it
      return {
        ...prev,
        competitions: [
          ...prev.competitions,
          {
            id: compId,
            name: compName || '',
            hostId: hostId || '',
            hostName: '',
            players: [{ id: playerId, name: playerName }],
            playerIds: [playerId],
            rounds: [],
            startDate: new Date().toISOString(),
            status: 'pending' as const,
          },
        ],
      };
    });

    try {
      const { data: existingComp, error: fetchError } = await supabase
        .from('competitions')
        .select('player_ids, player_names')
        .eq('id', compId)
        .single();

      if (fetchError || !existingComp) return;

      const pIds = existingComp.player_ids || [];
      const pNames = existingComp.player_names || [];

      if (!pIds.includes(playerId)) {
        const { error } = await supabase
          .from('competitions')
          .update({
            player_ids: [...pIds, playerId],
            player_names: [...pNames, playerName],
          })
          .eq('id', compId);
        
        if (error) console.error('Join comp error:', error);
      }
    } catch (e) {
      console.error('Join competition error:', e);
    }
  }, [data.player]);

  const deleteCompetition = useCallback(async (compId: string) => {
    // Remove locally first
    setData(prev => ({
      ...prev,
      competitions: prev.competitions.filter(c => c.id !== compId),
    }));

    try {
      const { error: roundsError } = await supabase.from('competition_rounds').delete().eq('competition_id', compId);
      if (roundsError) console.error('Delete rounds error:', roundsError);
      
      const { error } = await supabase.from('competitions').delete().eq('id', compId);
      if (error) {
        console.error('Delete comp error:', error);
        // Re-add locally if Supabase delete failed
        setData(prev => {
          if (prev.competitions.some(c => c.id === compId)) return prev;
          // Revert: restore from a backup or just leave it deleted locally
          return prev;
        });
      }
    } catch (e) {
      console.error('Delete competition error:', e);
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

  const finishCompetitionRound = useCallback(async (compId: string, round: Round, _playerIds: string[]) => {
    // Update local state immediately
    setData(prev => {
      const competitions = prev.competitions.map(c => {
        if (c.id !== compId) return c;
        const existingIdx = c.rounds.findIndex(r => r.playerId === round.playerId);
        let newRounds: Round[];
        if (existingIdx >= 0) {
          newRounds = [...c.rounds];
          newRounds[existingIdx] = round;
        } else {
          newRounds = [...c.rounds, round];
        }
        const playersWithRounds = new Set(newRounds.map(r => r.playerId));
        const allDone = c.players.every(p => playersWithRounds.has(p.id));
        return { ...c, rounds: newRounds, status: allDone ? 'finished' as const : 'active' as const };
      });
      return { ...prev, competitions };
    });

    // Save round to Supabase
    try {
      // Upsert: delete existing round for this player in this comp, then insert
      await supabase.from('competition_rounds').delete().eq('competition_id', compId).eq('player_id', round.playerId);
      
      const { error } = await supabase.from('competition_rounds').insert({
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
      if (error) console.error('Round insert error:', error);
    } catch (e) {
      console.error('Save round error:', e);
    }
  }, [data.player]);

  const addPlayerToCompetition = useCallback(async (compId: string, friendId: string) => {
    const friend = data.friends.find(f => f.id === friendId);
    if (!friend) return;

    const friendSupabaseId = friend.userId || friend.id;

    // Update local state
    setData(prev => ({
      ...prev,
      competitions: prev.competitions.map(c => {
        if (c.id !== compId) return c;
        if (c.players.some(p => p.id === friendSupabaseId)) return c;
        return {
          ...c,
          players: [...c.players, { id: friendSupabaseId, name: friend.name }],
          playerIds: [...c.playerIds, friendSupabaseId],
        };
      }),
    }));

    // Update Supabase
    try {
      const { data: existingComp } = await supabase
        .from('competitions')
        .select('player_ids, player_names')
        .eq('id', compId)
        .single();

      if (existingComp) {
        const pIds = existingComp.player_ids || [];
        const pNames = existingComp.player_names || [];
        if (!pIds.includes(friendSupabaseId)) {
          const { error } = await supabase
            .from('competitions')
            .update({
              player_ids: [...pIds, friendSupabaseId],
              player_names: [...pNames, friend.name],
            })
            .eq('id', compId);
          if (error) console.error('Add player error:', error);
        }
      }
    } catch (e) {
      console.error('Add player to comp error:', e);
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
      return { id: generateId(), date: date.toISOString(), courseName: courseNames[Math.floor(Math.random() * courseNames.length)], holes, totalScore, totalPar, relativeScore };
    });
    const sampleFriends = ['김철수', '이영희', '박민수', '정수진'].map(name => ({ id: generateId(), name }));
    setData(prev => ({ ...prev, rounds: [...sampleRounds, ...prev.rounds], friends: [...prev.friends, ...sampleFriends] }));
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
      data, setData, addRound, updateRound, deleteRound, updatePlayer,
      addFriend, removeFriend, updateFriend,
      createCompetition, joinCompetition, deleteCompetition,
      addRoundToCompetition, finishCompetitionRound, addPlayerToCompetition,
      addSampleData, clearAllData, clearLocalData, syncing,
    }}>
      {children}
    </GolfContext.Provider>
  );
};

export const useGolf = () => {
  const context = useContext(GolfContext);
  if (!context) throw new Error('useGolf must be used within GolfProvider');
  return context;
};
