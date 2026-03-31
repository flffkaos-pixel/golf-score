import { useState } from 'react';
import { useGolf } from '../hooks/useGolf';
import { useAppSettings } from '../hooks/useAppSettings';
import { getScoreDisplay } from '../utils/storage';

interface HistoryProps {
  onBack: () => void;
}

export default function History({ onBack }: HistoryProps) {
  const { data, deleteRound } = useGolf();
  const { t } = useAppSettings();
  const [selectedRound, setSelectedRound] = useState<typeof data.rounds[0] | null>(null);
  const [filter, setFilter] = useState<'all' | 'comp' | 'solo'>('all');

  const getScoreColor = (score: number | null, par: number) => {
    if (score === null) return 'bg-surface-container text-stone-400';
    const diff = score - par;
    if (diff <= -2) return 'bg-blue-500 text-white';
    if (diff === -1) return 'bg-secondary text-white';
    if (diff === 0) return 'bg-surface text-stone-800 dark:text-on-surface';
    if (diff === 1) return 'bg-yellow-400 text-stone-800 dark:text-stone-900';
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

  if (selectedRound) {
    const dateStr = new Date(selectedRound.date).toLocaleDateString();
    const birdies = selectedRound.holes.filter(h => h.score !== null && h.score < h.par).length;
    const pars = selectedRound.holes.filter(h => h.score !== null && h.score === h.par).length;
    const bogeys = selectedRound.holes.filter(h => h.score !== null && h.score > h.par).length;
    const comp = selectedRound.competitionId ? data.competitions.find(c => c.id === selectedRound.competitionId) : null;

    return (
      <div className="min-h-screen bg-surface pb-32">
        <header className="bg-white dark:bg-surface-container-lowest flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
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
      <header className="bg-white dark:bg-surface-container-lowest flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
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
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${filter === 'all' ? 'bg-primary text-white' : 'bg-surface-container text-stone-600 dark:text-on-surface'}`}
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
