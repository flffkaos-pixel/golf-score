import { useGolf } from '../hooks/useGolf';
import { useAppSettings } from '../hooks/useAppSettings';

interface CompetitionsProps {
  onBack: () => void;
}

export default function Competitions({ onBack }: CompetitionsProps) {
  const { data, createCompetition } = useGolf();
  const { t } = useAppSettings();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-secondary-container text-on-secondary-container';
      case 'active': return 'bg-secondary text-on-secondary';
      case 'finished': return 'bg-surface-container text-on-surface-variant';
      default: return 'bg-surface-container text-on-surface-variant';
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-surface">
      <header className="bg-surface-container-lowest flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <button onClick={onBack} className="p-2 -ml-2">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </button>
        <h1 className="text-xl font-extrabold text-primary font-headline">{t('competitions')}</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-6 pt-6 max-w-5xl mx-auto">
        <button
          onClick={() => {
            const name = prompt(t('compNamePrompt'));
            if (name) createCompetition(name);
          }}
          className="w-full gradient-primary text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-98 transition-transform"
        >
          <span className="material-symbols-outlined">add</span>
          {t('createComp')}
        </button>

        {data.competitions.length === 0 ? (
          <div className="mt-8 bg-surface-container-lowest rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-outline">emoji_events</span>
            </div>
            <div className="text-on-surface-variant mb-2 font-semibold">{t('noCompetitions')}</div>
            <div className="text-outline text-sm">{t('competitionsDesc')}</div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {data.competitions.map(comp => (
              <div key={comp.id} className="bg-surface-container-lowest rounded-2xl p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-primary font-headline">{comp.name}</h3>
                    <p className="text-xs text-on-surface-variant">{new Date(comp.startDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(comp.status)}`}>
                    {comp.status === 'pending' ? '대기중' : comp.status === 'active' ? '진행중' : '종료'}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-on-surface-variant font-bold">{t('participants')}</span>
                  <span className="text-sm text-on-surface-variant">{comp.players.length}명</span>
                </div>
                {comp.rounds.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">{t('ranking')}</p>
                    <div className="space-y-2">
                      {comp.rounds
                        .sort((a, b) => a.relativeScore - b.relativeScore)
                        .slice(0, 5)
                        .map((round, i) => (
                          <div key={round.id} className="flex items-center gap-3 p-3 bg-surface-container rounded-xl">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              i === 0 ? 'bg-secondary-container text-on-secondary-container' :
                              i === 1 ? 'bg-surface-container text-on-surface-variant' :
                              i === 2 ? 'bg-secondary-container/50 text-on-secondary-container' :
                              'bg-surface-container text-on-surface-variant'
                            }`}>
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-primary text-sm">{round.courseName}</p>
                              <p className="text-xs text-on-surface-variant">{round.totalScore}타</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
