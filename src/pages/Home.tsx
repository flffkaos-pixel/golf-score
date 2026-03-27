import { useState } from 'react';
import { useGolf } from '../hooks/useGolf';
import { useAppSettings } from '../hooks/useAppSettings';
import { getScoreDisplay } from '../utils/storage';

interface HomeProps {
  onStartGame: (compId?: string | null) => void;
}

export default function Home({ onStartGame }: HomeProps) {
  const { data, deleteRound, addSampleData, clearAllData } = useGolf();
  const { t } = useAppSettings();
  const [devMode, setDevMode] = useState(false);
  
  const recentRounds = data.rounds.slice(0, 5);
  const totalRounds = data.rounds.length;
  const avgScore = totalRounds > 0 
    ? Math.round(data.rounds.reduce((sum, r) => sum + r.totalScore, 0) / totalRounds)
    : 0;

  const handleDelete = (id: string) => {
    if (confirm(t('deleteConfirm'))) {
      deleteRound(id);
    }
  };

  const getAchievements = (round: typeof data.rounds[0]) => {
    const achievements: string[] = [];
    round.holes.forEach(hole => {
      if (hole.score !== null) {
        const diff = hole.score - hole.par;
        if (diff <= -3) achievements.push(t('holeInOne'));
        else if (diff === -2) achievements.push(t('eagle'));
        else if (diff === -1) achievements.push(t('birdie'));
      }
    });
    return achievements;
  };

  const shareScore = async (round: typeof data.rounds[0]) => {
    const scoreDisplay = getScoreDisplay(round.relativeScore);
    const text = `⛳ GreenScore ${t('recentRounds')}!\n\n📍 ${round.courseName}\n🏌️ ${round.totalScore} ${t('score')} (${scoreDisplay.text})\n📅 ${new Date(round.date).toLocaleDateString()}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(text);
      alert(t('copied'));
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-surface">
      {devMode && (
        <div className="bg-red-600 text-white px-4 py-2 text-sm">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <span>🔧 Dev Mode</span>
            <button onClick={() => setDevMode(false)}>✕</button>
          </div>
          <div className="flex gap-2 mt-2 max-w-5xl mx-auto">
            <button onClick={addSampleData} className="bg-white/20 px-3 py-1 rounded text-xs">📊 Add Sample</button>
            <button onClick={clearAllData} className="bg-red-800 px-3 py-1 rounded text-xs">🗑️ Clear All</button>
          </div>
        </div>
      )}

      <main className="px-6 pt-6 space-y-8 max-w-5xl mx-auto">
        <section className="relative overflow-hidden rounded-[2rem] bg-primary text-white p-8 min-h-[180px] flex flex-col justify-end group">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-tertiary-fixed opacity-10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-primary-fixed-dim text-sm font-semibold tracking-wider">{t('myPerformance')}</span>
            <h2 className="text-5xl font-extrabold font-headline leading-none tracking-tight">
              {avgScore > 0 ? avgScore : '-'}
              <span className="text-2xl font-medium ml-2 text-primary-fixed opacity-80">{t('avgScore')}</span>
            </h2>
            <p className="text-primary-fixed-dim/80 text-sm mt-2 font-medium">
              {totalRounds > 0 ? `${t('basedOn')}${totalRounds} ${t('lastRounds')}` : t('noRecords')}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold font-headline text-primary tracking-tight">{t('recentRounds')}</h2>
            <button 
              onClick={() => onStartGame(null)}
              className="bg-primary text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              {t('newRound')}
            </button>
          </div>

          {recentRounds.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-[2rem] p-8 text-center">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-outline">golf_course</span>
              </div>
              <div className="text-stone-500 mb-2 font-semibold">{t('noRecords')}</div>
              <div className="text-stone-400 text-sm">{t('startFirst')}</div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRounds.map(round => {
                const achievements = getAchievements(round);
                const dateStr = new Date(round.date).toLocaleDateString();
                const comp = round.competitionId ? data.competitions.find(c => c.id === round.competitionId) : null;
                
              return (
                <div key={round.id} className="bg-surface-container-lowest rounded-[1.5rem] p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      {comp && (
                        <span className="inline-block px-2 py-0.5 bg-secondary/10 text-secondary text-xs font-bold rounded-full mb-1">
                          🏆 {comp.name}
                        </span>
                      )}
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{dateStr}</p>
                      <h3 className="text-lg font-bold text-primary font-headline">{round.courseName}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-headline text-primary">{round.totalScore}</span>
                      <p className={`text-sm font-bold ${getScoreDisplay(round.relativeScore).color}`}>
                        {getScoreDisplay(round.relativeScore).text}
                      </p>
                    </div>
                  </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-surface-container-low rounded-xl py-3 px-2 text-center">
                        <p className="text-[10px] text-stone-500 font-bold mb-1">{t('putting')}</p>
                        <p className="text-lg font-bold text-primary font-headline">-</p>
                      </div>
                      <div className="bg-surface-container-low rounded-xl py-3 px-2 text-center">
                        <p className="text-[10px] text-stone-500 font-bold mb-1">{t('par')}</p>
                        <p className="text-lg font-bold text-primary font-headline">{round.holes.filter(h => h.score === h.par).length}</p>
                      </div>
                      <div className="bg-surface-container-low rounded-xl py-3 px-2 text-center">
                        <p className="text-[10px] text-stone-500 font-bold mb-1">{t('birdiePlus')}</p>
                        <p className="text-lg font-bold text-primary font-headline">{round.holes.filter(h => h.score !== null && h.score < h.par).length}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => shareScore(round)}
                        className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                      >
                        <span className="material-symbols-outlined">share</span>
                        {t('share')}
                      </button>
                      <button
                        onClick={() => handleDelete(round.id)}
                        className="bg-error-container text-error px-4 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>

                    {achievements.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {achievements.slice(0, 5).map((achievement, i) => (
                          <span key={i} className="bg-tertiary-fixed/20 text-tertiary px-3 py-1 rounded-full text-xs font-bold">
                            {achievement}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
