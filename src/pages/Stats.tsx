import { useGolf } from '../hooks/useGolf';
import { useAppSettings } from '../hooks/useAppSettings';
import { getScoreDisplay } from '../utils/storage';

interface StatsProps {
  onBack: () => void;
}

export default function Stats({ onBack }: StatsProps) {
  const { data } = useGolf();
  const { t } = useAppSettings();

  const totalRounds = data.rounds.length;
  const avgScore = totalRounds > 0
    ? (data.rounds.reduce((sum, r) => sum + r.totalScore, 0) / totalRounds).toFixed(1)
    : '-';
  
  const bestScore = totalRounds > 0
    ? Math.min(...data.rounds.map(r => r.totalScore))
    : '-';

  const totalHoles = data.rounds.reduce((count, round) => {
    return count + round.holes.filter(h => h.score !== null).length;
  }, 0);

  const eaglesOrBetter = data.rounds.reduce((count, round) => {
    return count + round.holes.filter(h => 
      h.score !== null && h.score <= h.par - 2
    ).length;
  }, 0);

  const birdies = data.rounds.reduce((count, round) => {
    return count + round.holes.filter(h => 
      h.score !== null && h.score === h.par - 1
    ).length;
  }, 0);

  const pars = data.rounds.reduce((count, round) => {
    return count + round.holes.filter(h => 
      h.score !== null && h.score === h.par
    ).length;
  }, 0);

  const bogeys = data.rounds.reduce((count, round) => {
    return count + round.holes.filter(h => 
      h.score !== null && h.score === h.par + 1
    ).length;
  }, 0);

  const doubleBogeyOrWorse = data.rounds.reduce((count, round) => {
    return count + round.holes.filter(h => 
      h.score !== null && h.score >= h.par + 2
    ).length;
  }, 0);

  const eaglePercent = totalHoles > 0 ? (eaglesOrBetter / totalHoles) * 100 : 0;
  const birdiePercent = totalHoles > 0 ? (birdies / totalHoles) * 100 : 0;
  const parPercent = totalHoles > 0 ? (pars / totalHoles) * 100 : 0;

  const sortedByScore = [...data.rounds].sort((a, b) => a.totalScore - b.totalScore);

  return (
    <div className="min-h-screen bg-surface pb-32">
      <header className="bg-white dark:bg-surface-container-lowest flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <button onClick={onBack} className="p-2 -ml-2">
          <span className="material-symbols-outlined text-stone-500">arrow_back</span>
        </button>
        <h1 className="text-xl font-extrabold text-primary font-headline">{t('stats')}</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-6 pt-6 max-w-5xl mx-auto">
        <section className="relative overflow-hidden rounded-[2rem] bg-primary-container text-white p-8 mb-8">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-tertiary-fixed/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-tertiary-fixed/20 text-tertiary-fixed rounded-full font-label text-xs font-bold uppercase tracking-widest mb-4">
              {t('myPerformance')}
            </span>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                  {bestScore !== '-' ? `${bestScore}${t('score')}` : t('noRecords')}
                </h2>
                <p className="text-white/70 text-lg">{t('bestScore')}</p>
              </div>
              <div className="flex gap-8 items-end">
                <div className="text-center">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">{t('avgScore')}</p>
                  <p className="font-headline text-4xl font-black">{avgScore}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">{t('totalRounds')}</p>
                  <p className="font-headline text-4xl font-black">{totalRounds}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h3 className="font-headline text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">analytics</span>
            {t('shotAnalysis')}
          </h3>
          <div className="relative w-48 h-48 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(
              from 0deg,
              #10b981 0deg ${eaglePercent}%,
              #3b82f6 ${eaglePercent}% ${eaglePercent + birdiePercent}%,
              #f59e0b ${eaglePercent + birdiePercent}% ${eaglePercent + birdiePercent + parPercent}%,
              #ef4444 ${eaglePercent + birdiePercent + parPercent}% 100%
            )` }}></div>
            <div className="absolute inset-6 rounded-full bg-surface flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{eaglesOrBetter + birdies}</div>
                <div className="text-sm text-stone-500">{t('birdiePlus')}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center text-sm mt-4">
            <div>
              <div className="flex items-center justify-center mb-2">
                <div className="w-5 h-5 rounded-full bg-green-500"></div>
                <span className="ml-2">{t('eagle')}</span>
              </div>
              <p className="font-medium">{eaglesOrBetter}</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <div className="w-5 h-5 rounded-full bg-blue-500"></div>
                <span className="ml-2">{t('birdie')}</span>
              </div>
              <p className="font-medium">{birdies}</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <div className="w-5 h-5 rounded-full bg-yellow-400"></div>
                <span className="ml-2">{t('par')}</span>
              </div>
              <p className="font-medium">{pars}</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <div className="w-5 h-5 rounded-full bg-red-500"></div>
                <span className="ml-2">{t('bogey')}+</span>
              </div>
              <p className="font-medium">{bogeys + doubleBogeyOrWorse}</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-headline text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">emoji_events</span>
            {t('personalBest')}
          </h3>
          {data.rounds.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center">
              <div className="text-stone-500">{t('noRecords')}</div>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedByScore.slice(0, 10).map((round, i) => {
                const scoreDisplay = getScoreDisplay(round.relativeScore);
                return (
                  <div key={round.id} className="bg-surface-container-lowest rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-headline ${
                        i === 0 ? 'bg-yellow-400 text-stone-900' :
                        i === 1 ? 'bg-stone-300 text-stone-700' :
                        i === 2 ? 'bg-amber-600 text-white' :
                        'bg-surface-container text-stone-600'
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-bold text-primary">{round.courseName}</div>
                        <div className="text-xs text-stone-500">{new Date(round.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black font-headline">{round.totalScore}</div>
                      <div className={`text-sm font-bold ${scoreDisplay.color}`}>{scoreDisplay.text}</div>
                    </div>
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
