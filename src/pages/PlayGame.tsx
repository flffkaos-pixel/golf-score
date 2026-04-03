import { useState, useEffect } from 'react';
import { useGolf } from '../hooks/useGolf';
import { useAppSettings } from '../hooks/useAppSettings';
import { calculateScore } from '../utils/storage';
import { saveCompetitionRoundToSupabase, fetchCompetitionRounds } from '../utils/supabaseCompetition';
import { supabase } from '../supabase';

interface PlayGameProps {
  onBack: () => void;
  onComplete: () => void;
  competitionId?: string;
}

export default function PlayGame({ onBack, onComplete, competitionId }: PlayGameProps) {
  const { data, addRound, updateRound, addRoundToCompetition, setData } = useGolf();
  const { t } = useAppSettings();
  const [courseName, setCourseName] = useState('');
  const [step, setStep] = useState<'name' | 'score'>('name');
  const [currentHole, setCurrentHole] = useState(0);
  const [round, setRound] = useState<ReturnType<typeof addRound> | null>(null);
  const [achievement, setAchievement] = useState<string | null>(null);
  const [showRankPopup, setShowRankPopup] = useState(false);
  const [compRankings, setCompRankings] = useState<{player: string; score: number; relative: number}[]>([]);
  const [liveOpponentScores, setLiveOpponentScores] = useState<Array<{playerId: string; playerName: string; totalScore: number; totalPar: number; relativeScore: number; completedHoles: number}>>([]);

  const inProgressRounds = data.rounds.filter(r => r.holes.some(h => h.score !== null) && r.holes.some(h => h.score === null));

  // Fetch live opponent scores during competition play
  useEffect(() => {
    if (!competitionId) return;
    
    const fetchOpponentScores = async () => {
      const { data: rounds } = await supabase
        .from('competition_rounds')
        .select('*')
        .eq('competition_id', competitionId);
      
      if (rounds) {
        const opponents = rounds
          .filter(r => r.player_id !== data.player.id)
          .map(r => {
            const holes = r.holes as any[];
            const completedHoles = holes.filter(h => h.score !== null).length;
            return {
              playerId: r.player_id,
              playerName: r.player_name,
              totalScore: r.total_score,
              totalPar: r.total_par,
              relativeScore: r.relative_score,
              completedHoles,
            };
          });
        setLiveOpponentScores(opponents);
      }
    };

    fetchOpponentScores();
    
    const channel = supabase
      .channel(`comp-live-${competitionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'competition_rounds', filter: `competition_id=eq.${competitionId}` },
        () => { fetchOpponentScores(); }
      )
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [competitionId, data.player.id, data.competitions]);

  const handleStart = () => {
    if (!courseName.trim()) return;
    const newRound = addRound(courseName.trim());
    if (competitionId) {
      const updatedRound = { ...newRound, competitionId, playerId: data.player.id };
      updateRound(updatedRound);
      addRoundToCompetition(competitionId, updatedRound);
    }
    setRound(competitionId ? { ...newRound, competitionId, playerId: data.player.id } : newRound);
    setStep('score');
  };

  const handleContinue = (roundId: string) => {
    const r = data.rounds.find(r => r.id === roundId);
    if (r) {
      setRound(r);
      setCourseName(r.courseName);
      setStep('score');
      const lastHole = r.holes.findIndex(h => h.score === null);
      setCurrentHole(lastHole > 0 ? lastHole : 0);
    }
  };

  const handleExit = (save: boolean = true) => {
    if (!save && round) {
      const completedHoles = round.holes.filter(h => h.score !== null).length;
      if (completedHoles > 0) {
        if (confirm('저장하지 않고 나가면 입력한 데이터가 삭제됩니다. 나가시겠습니까?')) {
          setStep('name');
          setRound(null);
          setCurrentHole(0);
        }
        return;
      }
    }
    setStep('name');
    setRound(null);
    setCurrentHole(0);
  };

  const updateScore = (holeIndex: number, score: number) => {
    if (!round) return;
    const newHoles = [...round.holes];
    newHoles[holeIndex] = { ...newHoles[holeIndex], score };
    const calculated = calculateScore(newHoles);
    const updated = {
      ...round,
      holes: newHoles,
      ...calculated,
    };
    setRound(updated);
    updateRound(updated);
  };

  const checkAchievementAndNext = () => {
    if (!round) return;
    const currentHoleData = round.holes[currentHole];
    if (currentHoleData.score !== null) {
      const diff = currentHoleData.score - currentHoleData.par;
      if (diff <= -3) {
        setAchievement(t('holeInOne'));
        setTimeout(() => setAchievement(null), 3000);
      } else if (diff === -2) {
        setAchievement(t('eagle'));
        setTimeout(() => setAchievement(null), 2000);
      } else if (diff === -1) {
        setAchievement(t('birdie'));
        setTimeout(() => setAchievement(null), 2000);
      } else if (diff === 0) {
        setAchievement(t('par'));
        setTimeout(() => setAchievement(null), 1500);
      }
    }
    
    if (currentHole < 17) {
      setCurrentHole(currentHole + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (competitionId) {
      const comp = data.competitions.find(c => c.id === competitionId);
      if (comp) {
        const updatedRound = { ...round!, playerId: data.player.id, competitionId };
        
        // Save to Supabase
        await saveCompetitionRoundToSupabase(competitionId, updatedRound, data.player.name);
        
        // Fetch latest rounds from Supabase
        await fetchCompetitionRounds(competitionId);
        
        // Update competition rounds
        const existingRoundIndex = comp.rounds.findIndex(r => r.playerId === data.player.id);
        let allRounds: typeof comp.rounds;
        if (existingRoundIndex >= 0) {
          allRounds = [...comp.rounds];
          allRounds[existingRoundIndex] = updatedRound;
        } else {
          allRounds = [...comp.rounds, updatedRound];
        }
        
        const sorted = allRounds.sort((a, b) => a.relativeScore - b.relativeScore);
        const rankings = sorted.map(r => {
          const player = comp.players.find(p => p.id === r.playerId);
          return {
            player: player?.name || 'Unknown',
            score: r.totalScore,
            relative: r.relativeScore,
          };
        });
        setCompRankings(rankings);
        setShowRankPopup(true);
        
        // Check if all players have finished
        const playerIdsWithRounds = new Set(allRounds.map(r => r.playerId));
        const allFinished = comp.players.every(p => playerIdsWithRounds.has(p.id));
        
        // Update both round and competition in one state update
        setData(prev => {
          const roundExists = prev.rounds.some(r => r.id === updatedRound.id);
          const newRounds = roundExists
            ? prev.rounds.map(r => r.id === updatedRound.id ? updatedRound : r)
            : [updatedRound, ...prev.rounds];
          
          return {
            ...prev,
            rounds: newRounds,
            competitions: prev.competitions.map(c => 
              c.id === competitionId
                ? { ...c, rounds: allRounds, status: allFinished ? 'finished' as const : 'active' as const }
                : c
            ),
          };
        });
        
        return;
      }
    }
    onComplete();
  };

  const getScoreColor = (score: number | null, par: number) => {
    if (score === null) return 'bg-surface-container text-stone-400';
    const diff = score - par;
    if (diff <= -2) return 'bg-blue-500 text-white';
    if (diff === -1) return 'bg-secondary text-white';
    if (diff === 0) return 'bg-surface text-stone-800';
    if (diff === 1) return 'bg-yellow-400 text-stone-800';
    if (diff === 2) return 'bg-orange-400 text-white';
    return 'bg-red-500 text-white';
  };

  if (step === 'name') {
    return (
      <div className="min-h-screen bg-surface pb-32">
        <header className="bg-white flex justify-between items-center w-full px-6 py-4 sticky top-0 z-50">
          <button onClick={onBack} className="p-2 -ml-2">
            <span className="material-symbols-outlined text-stone-500">arrow_back</span>
          </button>
          <h1 className="text-xl font-extrabold text-primary font-headline">{t('newRound')}</h1>
          <div className="w-10"></div>
        </header>

        <main className="px-6 pt-8 max-w-md mx-auto">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-3 font-headline">
                {t('courseName')}
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder={t('coursePlaceholder')}
                className="w-full bg-surface-container-low border-none rounded-2xl py-5 px-6 text-lg outline-none focus:ring-2 focus:ring-secondary-container transition-all placeholder:text-outline/60 font-body text-primary"
              />
            </div>

            <button
              onClick={handleStart}
              disabled={!courseName.trim()}
              className="w-full bg-primary text-white py-5 rounded-2xl font-headline font-extrabold text-lg shadow-lg active:scale-98 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('startRound')}
            </button>

            {inProgressRounds.length > 0 && (
              <div className="mt-8">
                <h3 className="font-headline font-bold text-lg mb-4 text-primary">진행 중인 라운드</h3>
                <div className="space-y-3">
                  {inProgressRounds.map(r => {
                    const completed = r.holes.filter(h => h.score !== null).length;
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleContinue(r.id)}
                        className="w-full bg-surface-container p-4 rounded-2xl flex justify-between items-center active:scale-98 transition-transform"
                      >
                        <div className="text-left">
                          <div className="font-bold text-primary">{r.courseName}</div>
                          <div className="text-sm text-stone-500">{completed}/18홀 진행중</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold font-headline ${r.relativeScore > 0 ? 'text-error' : r.relativeScore < 0 ? 'text-secondary' : 'text-stone-600'}`}>
                            {r.totalScore}
                          </div>
                          <div className="text-xs text-stone-500">
                            {r.relativeScore > 0 ? `+${r.relativeScore}` : r.relativeScore === 0 ? 'E' : r.relativeScore}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (!round) return null;

  const currentHoleData = round.holes[currentHole];
  const completedHoles = round.holes.filter(h => h.score !== null).length;

  const handlePopupClose = () => {
    setShowRankPopup(false);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-surface pb-32">
      {showRankPopup && (
        <div className="fixed inset-0 bg-primary/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm text-center animate-bounce shadow-2xl">
            <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏆</span>
            </div>
            <h2 className="text-2xl font-extrabold text-primary font-headline mb-4">대회 완료!</h2>
            <div className="space-y-2 mb-6">
              {compRankings.map((r, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${
                  i === 0 ? 'bg-yellow-100' : i === 1 ? 'bg-stone-100' : i === 2 ? 'bg-amber-100' : 'bg-surface-container'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-yellow-400 text-stone-900' : 
                      i === 1 ? 'bg-stone-300 text-stone-700' : 
                      i === 2 ? 'bg-amber-600 text-white' : 'bg-surface-container text-stone-600'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="font-bold text-primary">{r.player}</span>
                  </div>
                  <span className={`font-bold ${
                    r.relative > 0 ? 'text-error' : r.relative < 0 ? 'text-secondary' : 'text-stone-600'
                  }`}>
                    {r.score} ({r.relative > 0 ? '+' : ''}{r.relative})
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={handlePopupClose}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold active:scale-98 transition-transform"
            >
              확인
            </button>
          </div>
        </div>
      )}
      {achievement && (
        <div className="fixed inset-0 bg-primary/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-[2rem] p-12 text-center animate-bounce">
            <div className="w-20 h-20 bg-tertiary-fixed rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⛳</span>
            </div>
            <div className="text-4xl font-extrabold text-primary font-headline mb-2">{achievement}!</div>
            <div className="text-stone-500">Great shot!</div>
          </div>
        </div>
      )}

      <header className="bg-white flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <button onClick={() => handleExit(false)} className="p-2 -ml-2">
          <span className="material-symbols-outlined text-stone-500">close</span>
        </button>
        <div className="text-center">
          <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">{courseName}</p>
          <p className="text-lg font-bold text-primary font-headline">{completedHoles}/18 {t('hole')}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">{t('totalScore')}</p>
          <p className={`text-lg font-bold font-headline ${
            round.relativeScore > 0 ? 'text-error' : 
            round.relativeScore < 0 ? 'text-secondary' : 'text-stone-600'
          }`}>
            {round.totalScore}
          </p>
        </div>
      </header>

      {competitionId && liveOpponentScores.length > 0 && (
        <div className="px-4 mt-4 max-w-md mx-auto">
          <div className="bg-surface-container rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-sm text-secondary">compare_arrows</span>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">실시간 비교</span>
            </div>
            <div className="space-y-2">
              {liveOpponentScores.map(opp => {
                const diff = round.relativeScore - opp.relativeScore;
                const isBehind = diff > 0;
                const isAhead = diff < 0;
                const isTied = diff === 0;
                return (
                  <div key={opp.playerId} className="flex items-center justify-between bg-surface-container-lowest rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        opp.completedHoles === 18 ? 'bg-secondary/20 text-secondary' : 'bg-stone-200 text-stone-500'
                      }`}>
                        {opp.completedHoles}
                      </div>
                      <span className="text-sm font-bold text-primary">{opp.playerName}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${
                        isAhead ? 'text-secondary' : isBehind ? 'text-error' : 'text-stone-500'
                      }`}>
                        {isTied ? '동률' : isAhead ? `${Math.abs(diff)}타 앞` : `${diff}타 뒤`}
                      </span>
                      <span className="text-xs text-stone-400 ml-1">
                        ({opp.totalScore})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className="pt-6 px-4 max-w-md mx-auto">
        <section className="relative overflow-hidden rounded-[1.5rem] bg-primary text-white p-6 mb-6 shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary-fixed/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-2">
              <h2 className="text-4xl font-extrabold font-headline">
                {currentHole + 1} {t('hole')}
              </h2>
              <div className="bg-tertiary-fixed text-tertiary px-4 py-1 rounded-full font-bold text-lg">
                {t('par')} {currentHoleData.par}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[3, 4, 5].map(par => (
            <button
              key={par}
              onClick={() => {
                const newHoles = [...round.holes];
                newHoles[currentHole] = { ...newHoles[currentHole], par };
                const calculated = calculateScore(newHoles);
                const updated = { ...round, holes: newHoles, ...calculated };
                setRound(updated);
                updateRound(updated);
              }}
              className={`py-3 rounded-2xl font-bold font-headline transition-all active:scale-95 ${
                currentHoleData.par === par 
                  ? 'bg-secondary text-white shadow-lg' 
                  : 'bg-surface-container text-stone-600'
              }`}
            >
              Par {par}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(score => (
            <button
              key={score}
              onClick={() => updateScore(currentHole, score)}
              className={`aspect-square rounded-2xl font-extrabold font-headline text-xl flex items-center justify-center transition-all active:scale-95 ${getScoreColor(currentHoleData.score === score ? score : null, currentHoleData.par)} ${currentHoleData.score === score ? 'ring-4 ring-tertiary-fixed shadow-lg' : ''}`}
            >
              {score}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2">
          {[16, 17, 18, 19, 20].map(score => (
            <button
              key={score}
              onClick={() => updateScore(currentHole, score)}
              className={`aspect-square rounded-2xl font-extrabold font-headline text-xl flex items-center justify-center transition-all active:scale-95 ${getScoreColor(currentHoleData.score === score ? score : null, currentHoleData.par)}`}
            >
              {score}
            </button>
          ))}
          <button
            onClick={() => updateScore(currentHole, 0)}
            className="aspect-square rounded-2xl bg-surface-container text-stone-500 font-bold text-xs flex items-center justify-center transition-all active:scale-95"
          >
            DEL
          </button>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              handleExit();
              onComplete();
            }}
            className="flex-1 bg-surface-container text-stone-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">save</span>
            저장
          </button>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setCurrentHole(Math.max(0, currentHole - 1))}
            disabled={currentHole === 0}
            className="flex-1 bg-surface-container text-on-surface-variant font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-30"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            {t('previous')}
          </button>
          <button
            onClick={checkAchievementAndNext}
            className="flex-2 bg-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-transform flex-[2]"
          >
            {currentHole < 17 ? (
              <>
                {t('next')}
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            ) : (
              <>
                {t('finish')}
                <span className="material-symbols-outlined">check_circle</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 pb-0 mt-6">
          <div className="flex gap-1 overflow-x-auto hide-scrollbar py-1">
            {round.holes.map((hole, i) => (
              <button
                key={i}
                onClick={() => setCurrentHole(i)}
                className={`min-w-[2.25rem] h-10 px-1 rounded-xl text-sm font-bold transition-all flex-shrink-0 ${
                  i === currentHole 
                    ? 'bg-primary text-white shadow-md' 
                    : hole.score !== null 
                      ? getScoreColor(hole.score, hole.par)
                      : 'bg-surface-container text-stone-400'
                }`}
              >
                {hole.score !== null ? hole.score : i + 1}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
