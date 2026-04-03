import { useState, useEffect } from 'react';
import { useGolf } from '../hooks/useGolf';
import { useAppSettings } from '../hooks/useAppSettings';
import { getScoreDisplay } from '../utils/storage';
import { fetchCompetitionRounds } from '../utils/supabaseCompetition';

interface HistoryProps {
  onBack: () => void;
}

interface SupabaseRound {
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

interface CompPlayerInfo {
  player_id: string;
  player_name: string;
  round: SupabaseRound | null;
  rank: number;
}

export default function History({ onBack }: HistoryProps) {
  const { data, deleteRound } = useGolf();
  const { t } = useAppSettings();
  const [selectedRound, setSelectedRound] = useState<typeof data.rounds[0] | null>(null);
  const [filter, setFilter] = useState<'all' | 'comp' | 'solo'>('all');
  const [, setCompRounds] = useState<SupabaseRound[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(false);
  const [compPlayers, setCompPlayers] = useState<CompPlayerInfo[]>([]);

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

  const filteredRounds = data.rounds.filter(r => {
    if (filter === 'comp') return !!r.competitionId;
    if (filter === 'solo') return !r.competitionId;
    return true;
  });

  const compRoundsCount = data.rounds.filter(r => r.competitionId).length;
  const soloRoundsCount = data.rounds.filter(r => !r.competitionId).length;

  useEffect(() => {
    if (selectedRound?.competitionId) {
      setLoadingRounds(true);
      fetchCompetitionRounds(selectedRound.competitionId).then(rounds => {
        setCompRounds(rounds);
        
        // Build player list with rounds
        const comp = data.competitions.find(c => c.id === selectedRound.competitionId);
        if (comp) {
          const sorted = [...rounds].sort((a, b) => a.relative_score - b.relative_score);
          const players: CompPlayerInfo[] = comp.players.map((player) => {
            const round = rounds.find(r => r.player_id === player.id) || null;
            const rank = round ? sorted.findIndex(r => r.player_id === player.id) + 1 : 0;
            return {
              player_id: player.id,
              player_name: player.name,
              round,
              rank,
            };
          });
          setCompPlayers(players);
        }
        
        setLoadingRounds(false);
      });
    }
  }, [selectedRound?.competitionId, data.competitions]);

  if (selectedRound) {
    const dateStr = new Date(selectedRound.date).toLocaleDateString();
    const birdies = selectedRound.holes.filter(h => h.score !== null && h.score < h.par).length;
    const pars = selectedRound.holes.filter(h => h.score !== null && h.score === h.par).length;
    const bogeys = selectedRound.holes.filter(h => h.score !== null && h.score > h.par).length;
    const comp = selectedRound.competitionId ? data.competitions.find(c => c.id === selectedRound.competitionId) : null;

    return (
      <div className="min-h-screen bg-surface pb-32">
        <header className="bg-white flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
          <button onClick={() => setSelectedRound(null)} className="p-2 -ml-2">
            <span className="material-symbols-outlined text-stone-500">arrow_back</span>
          </button>
          <h1 className="text-xl font-extrabold text-primary font-headline">{t('roundDetail')}</h1>
          <div className="w-10"></div>
        </header>

        <main className="px-6 pt-6 max-w-5xl mx-auto">
          <section className="relative overflow-hidden rounded-[2rem] bg-primary-container text-white p-8 mb-8">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-tertiary-fixed/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              {comp && (
                <span className="inline-block px-3 py-1 bg-secondary/20 text-secondary rounded-full font-label text-xs font-bold uppercase tracking-widest mb-4">
                  🏆 {comp.name}
                </span>
              )}
              {!comp && (
                <span className="inline-block px-3 py-1 bg-white/10 text-white/70 rounded-full font-label text-xs font-bold uppercase tracking-widest mb-4">
                  개인 기록
                </span>
              )}
              <h2 className="font-headline text-3xl font-extrabold tracking-tight mb-2">{selectedRound.courseName}</h2>
              <p className="text-white/70 text-lg mb-6">{dateStr}</p>
              <div className="flex gap-8 items-end">
                <div className="text-center">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">{t('totalScore')}</p>
                  <p className="font-headline text-5xl font-black">{selectedRound.totalScore}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
              <p className="text-2xl font-black font-headline text-secondary">{birdies}</p>
              <p className="text-xs text-stone-500 font-bold">{t('birdiePlus')}</p>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
              <p className="text-2xl font-black font-headline">{pars}</p>
              <p className="text-xs text-stone-500 font-bold">{t('par')}</p>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
              <p className="text-2xl font-black font-headline text-yellow-600">{bogeys}</p>
              <p className="text-xs text-stone-500 font-bold">{t('bogey')}+</p>
            </div>
          </div>

          {comp && (
            <section className="bg-surface-container-lowest rounded-[2rem] p-6 mb-8">
              <h3 className="font-headline text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">emoji_events</span>
                대회 참가자 성적
              </h3>
              {loadingRounds ? (
                <p className="text-stone-500 text-center py-4">로딩중...</p>
              ) : compPlayers.length > 0 ? (
                <div className="space-y-3">
                  {compPlayers
                    .sort((a, b) => {
                      if (!a.round && !b.round) return 0;
                      if (!a.round) return 1;
                      if (!b.round) return -1;
                      return a.round.relative_score - b.round.relative_score;
                    })
                    .map((player, index) => {
                      const isCurrentUser = player.player_id === data.player.id;
                      const hasRound = player.round !== null;
                      return (
                        <div key={player.player_id} className={`p-4 rounded-xl ${isCurrentUser ? 'bg-secondary/10 border border-secondary/20' : 'bg-surface-container'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                hasRound ? (
                                  index === 0 ? 'bg-yellow-400 text-stone-900' :
                                  index === 1 ? 'bg-stone-300 text-stone-700' :
                                  index === 2 ? 'bg-amber-600 text-white' : 'bg-surface-container text-stone-600'
                                ) : 'bg-stone-200 text-stone-400'
                              }`}>
                                {hasRound ? index + 1 : '-'}
                              </div>
                              <span className="font-bold text-primary">
                                {player.player_name}
                                {isCurrentUser && <span className="ml-1 text-secondary text-sm">(나)</span>}
                              </span>
                            </div>
                            {hasRound ? (
                              <div className="text-right">
                                <div className={`font-bold ${getScoreDisplay(player.round!.relative_score).color}`}>
                                  {player.round!.total_score} ({getScoreDisplay(player.round!.relative_score).text})
                                </div>
                                <div className="text-xs text-stone-400">{player.round!.course_name}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-stone-400 bg-stone-100 px-3 py-1 rounded-full">아직 미완료</span>
                            )}
                          </div>
                          {hasRound && player.round && (
                            <div className="flex gap-1 flex-wrap mt-2">
                              {player.round.holes.slice(0, 18).map((hole: any, i: number) => {
                                if (hole.score === null || hole.score === undefined) return null;
                                const diff = hole.score - hole.par;
                                let color = 'bg-stone-200 text-stone-600';
                                if (diff <= -2) color = 'bg-blue-500 text-white';
                                else if (diff === -1) color = 'bg-secondary text-white';
                                else if (diff === 0) color = 'bg-surface-container text-stone-600';
                                else if (diff === 1) color = 'bg-yellow-400 text-stone-800';
                                else if (diff === 2) color = 'bg-orange-400 text-white';
                                else color = 'bg-red-500 text-white';
                                return (
                                  <div key={i} className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${color}`}>
                                    {hole.score}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-stone-500 text-center py-4">아직 다른 참가자의 기록이 없습니다</p>
              )}
            </section>
          )}

          <section className="bg-surface-container-lowest rounded-[2rem] p-6 mb-8">
            <h3 className="font-headline text-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">scoreboard</span>
              {t('holeCount')}별 상세 스코어
            </h3>

            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3 px-2">{t('outCourse')}</h4>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                <div className="flex flex-col gap-2 w-12 text-center flex-none">
                  <div className="h-8 flex items-center justify-center bg-surface-container font-bold text-xs rounded-lg">H</div>
                  <div className="h-10 flex items-center justify-center bg-surface-low font-bold text-xs rounded-lg text-stone-500">{t('par')}</div>
                </div>
                {selectedRound.holes.slice(0, 9).map((hole, i) => (
                  <div key={i} className="flex flex-col gap-2 w-10 text-center flex-none">
                    <div className="h-8 flex items-center justify-center font-bold text-xs">{i + 1}</div>
                    <div className="h-10 flex items-center justify-center text-xs text-stone-500">{hole.par}</div>
                    <div className={`h-12 flex items-center justify-center rounded-xl font-headline font-bold text-sm ${getScoreColor(hole.score, hole.par)}`}>
                      {hole.score ?? '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3 px-2">{t('inCourse')}</h4>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                <div className="flex flex-col gap-2 w-12 text-center flex-none">
                  <div className="h-8 flex items-center justify-center bg-surface-container font-bold text-xs rounded-lg">H</div>
                  <div className="h-10 flex items-center justify-center bg-surface-low font-bold text-xs rounded-lg text-stone-500">{t('par')}</div>
                </div>
                {selectedRound.holes.slice(9, 18).map((hole, i) => (
                  <div key={i} className="flex flex-col gap-2 w-10 text-center flex-none">
                    <div className="h-8 flex items-center justify-center font-bold text-xs">{i + 10}</div>
                    <div className="h-10 flex items-center justify-center text-xs text-stone-500">{hole.par}</div>
                    <div className={`h-12 flex items-center justify-center rounded-xl font-headline font-bold text-sm ${getScoreColor(hole.score, hole.par)}`}>
                      {hole.score ?? '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <button
            onClick={() => {
              if (confirm(t('deleteConfirm'))) {
                deleteRound(selectedRound.id);
                setSelectedRound(null);
              }
            }}
            className="w-full bg-error-container text-error py-4 rounded-2xl font-bold active:scale-98 transition-transform"
          >
            {t('delete')}
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-32">
      <header className="bg-white flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <button onClick={onBack} className="p-2 -ml-2">
          <span className="material-symbols-outlined text-stone-500">arrow_back</span>
        </button>
        <h1 className="text-xl font-extrabold text-primary font-headline">{t('history')}</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-6 pt-6 max-w-5xl mx-auto">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${filter === 'all' ? 'bg-primary text-white' : 'bg-surface-container text-stone-600'}`}
          >
            전체 ({data.rounds.length})
          </button>
          <button
            onClick={() => setFilter('comp')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${filter === 'comp' ? 'bg-secondary text-white' : 'bg-surface-container text-stone-600'}`}
          >
            🏆 대회 ({compRoundsCount})
          </button>
          <button
            onClick={() => setFilter('solo')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${filter === 'solo' ? 'bg-stone-500 text-white' : 'bg-surface-container text-stone-600'}`}
          >
            개인 ({soloRoundsCount})
          </button>
        </div>

        {filteredRounds.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-outline">history</span>
            </div>
            <div className="text-stone-500 mb-2 font-semibold">{t('noRecords')}</div>
            <div className="text-stone-400 text-sm">{t('startFirst')}</div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRounds.map(round => {
              const scoreDisplay = getScoreDisplay(round.relativeScore);
              const dateStr = new Date(round.date).toLocaleDateString();
              const comp = round.competitionId ? data.competitions.find(c => c.id === round.competitionId) : null;
              
              return (
                <button
                  key={round.id}
                  onClick={() => setSelectedRound(round)}
                  className="w-full bg-surface-container-lowest rounded-2xl p-5 text-left active:scale-98 transition-transform"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      {comp && (
                        <span className="inline-block px-2 py-0.5 bg-secondary/10 text-secondary text-xs font-bold rounded-full mb-1">
                          🏆 {comp.name}
                        </span>
                      )}
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{dateStr}</p>
                      <h3 className="text-lg font-bold text-primary font-headline">{round.courseName}</h3>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl ${comp ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-stone-600'}`}>
                      <span className="text-2xl font-black font-headline">{round.totalScore}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-stone-500">
                      <span>{t('par')} {round.holes.filter(h => h.score === h.par).length}</span>
                      <span>{t('birdiePlus')} {round.holes.filter(h => h.score !== null && h.score < h.par).length}</span>
                    </div>
                    <span className={`font-bold ${scoreDisplay.color}`}>{scoreDisplay.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
