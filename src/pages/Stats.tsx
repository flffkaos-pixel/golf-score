import { useGolf } from '../hooks/useGolf';
import { useAppSettings } from '../hooks/useAppSettings';
import type { Round } from '../types';

interface StatsProps {
  onBack: () => void;
}

export default function Stats({ onBack }: StatsProps) {
  const { data } = useGolf();
  const { t } = useAppSettings();

  const totalRounds = data.rounds.length;
  const avgScore = totalRounds > 0
    ? Math.round(data.rounds.reduce((sum, r) => sum + r.totalScore, 0) / totalRounds)
    : 0;

  const getStats = () => {
    let eaglesOrBetter = 0;
    let birdies = 0;
    let pars = 0;
    let bogeys = 0;
    let others = 0;
    let totalHolesPlayed = 0;

    data.rounds.forEach((round: Round) => {
      round.holes.forEach(hole => {
        if (hole.score !== null) {
          totalHolesPlayed++;
          const diff = hole.score - hole.par;
          if (diff <= -2) eaglesOrBetter++;
          else if (diff === -1) birdies++;
          else if (diff === 0) pars++;
          else if (diff <= 2) bogeys++;
          else others++;
        }
      });
    });

    return { eaglesOrBetter, birdies, pars, bogeys, others, totalHolesPlayed };
  };

  const stats = getStats();

  const getScoreDisplay = (relativeScore: number) => {
    if (relativeScore < 0) return { text: `${relativeScore}`, color: 'text-secondary' };
    if (relativeScore === 0) return { text: 'E', color: 'text-on-surface' };
    return { text: `+${relativeScore}`, color: 'text-error' };
  };

  const sortedByScore = [...data.rounds].sort((a, b) => a.relativeScore - b.relativeScore);

  return (
    <div className="min-h-screen bg-surface pb-32">
      <header className="bg-surface-container-lowest flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <button onClick={onBack} className="p-2 -ml-2">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </button>
        <h1 className="text-xl font-extrabold text-primary font-headline">{t('stats')}</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-6 pt-6 max-w-5xl mx-auto space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-surface-container-low p-6">
          <div className="text-center mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">{t('avgScore')}</p>
            <p className="text-5xl font-black font-headline text-primary">{avgScore || '-'}</p>
            <p className="text-sm text-on-surface-variant mt-1">
              {totalRounds} {t('lastRounds')}
            </p>
          </div>

          <div className="relative w-48 h-24 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 200 100">
              <path
                d="M 20 80 Q 100 20 180 80"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-outline opacity-30"
                style={{ strokeDasharray: '8 4' }}
              />
              <path
                d="M 20 80 Q 100 60 180 80"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-secondary"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-3">
          <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
            <p className="text-2xl font-black font-headline score-lime">{stats.eaglesOrBetter + stats.birdies}</p>
            <p className="text-[10px] text-on-surface-variant font-bold mt-1">{t('birdiePlus')}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
            <p className="text-2xl font-black font-headline text-on-surface">{stats.pars}</p>
            <p className="text-[10px] text-on-surface-variant font-bold mt-1">{t('par')}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
            <p className="text-2xl font-black font-headline text-secondary">{stats.bogeys}</p>
            <p className="text-[10px] text-on-surface-variant font-bold mt-1">{t('bogey')}+</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
            <p className="text-2xl font-black font-headline text-on-surface-variant">{totalRounds}</p>
            <p className="text-[10px] text-on-surface-variant font-bold mt-1">{t('totalRounds')}</p>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-2xl p-6">
          <h3 className="font-headline text-lg font-bold text-primary mb-4">{t('bestRounds')}</h3>
          {data.rounds.length === 0 ? (
            <div className="bg-surface-container-low rounded-2xl p-8 text-center">
              <div className="text-on-surface-variant">{t('noRecords')}</div>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedByScore.slice(0, 10).map((round, i) => {
                const scoreDisplay = getScoreDisplay(round.relativeScore);
                return (
                  <div key={round.id} className="bg-surface-container-low rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-headline ${
                        i === 0 ? 'bg-secondary-container text-on-secondary-container' :
                        i === 1 ? 'bg-surface-container text-on-surface-variant' :
                        i === 2 ? 'bg-secondary-container/50 text-on-secondary-container' :
                        'bg-surface-container text-on-surface-variant'
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-bold text-primary">{round.courseName}</div>
                        <div className="text-xs text-on-surface-variant">{new Date(round.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black font-headline text-lg text-primary">{round.totalScore}</div>
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
