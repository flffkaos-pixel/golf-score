import { useState } from 'react';
import { useGolf } from '../hooks/useGolf';
import { useAppSettings } from '../hooks/useAppSettings';

interface PlayGameProps {
  onBack: () => void;
  onComplete: () => void;
}

const parOptions = [3, 4, 4, 5];

export default function PlayGame({ onBack, onComplete }: PlayGameProps) {
  const { addRound, updateRound } = useGolf();
  const { t } = useAppSettings();
  const [courseName, setCourseName] = useState('');
  const [showCourseInput, setShowCourseInput] = useState(true);
  const [round, setRound] = useState<{
    id: string;
    courseName: string;
    holes: { number: number; par: number; score: number | null }[];
  } | null>(null);

  const getScoreColor = (score: number | null, par: number) => {
    if (score === null) return 'bg-surface-container text-on-surface-variant';
    const diff = score - par;
    if (diff <= -2) return 'bg-secondary text-on-secondary';
    if (diff === -1) return 'bg-secondary text-on-secondary';
    if (diff === 0) return 'bg-surface-container-low text-on-surface';
    if (diff === 1) return 'bg-secondary-container text-on-secondary-container';
    if (diff === 2) return 'bg-secondary-container text-on-secondary-container';
    return 'bg-error-container text-error';
  };

  const handleStartRound = () => {
    if (!courseName.trim()) {
      alert('코스 이름을 입력해주세요');
      return;
    }
    const holes = Array.from({ length: 18 }, (_, i) => ({
      number: i + 1,
      par: parOptions[Math.floor(Math.random() * parOptions.length)],
      score: null,
    }));
    setRound({
      id: Date.now().toString(),
      courseName: courseName.trim(),
      holes,
    });
    setShowCourseInput(false);
  };

  const handleScoreInput = (holeIndex: number) => {
    if (!round) return;
    const currentScore = round.holes[holeIndex].score;
    const par = round.holes[holeIndex].par;

    const input = prompt(`${holeIndex + 1}번 홀 (Par ${par})\n스코어를 입력하세요 (1-15):`, currentScore?.toString() || '');

    if (input === null) return;

    const score = parseInt(input);
    if (isNaN(score) || score < 1 || score > 15) {
      alert('1에서 15 사이의 숫자를 입력해주세요');
      return;
    }

    const newHoles = [...round.holes];
    newHoles[holeIndex] = { ...newHoles[holeIndex], score };
    setRound({ ...round, holes: newHoles });
  };

  const getCurrentHoleIndex = () => {
    if (!round) return 0;
    const firstUnscored = round.holes.findIndex(h => h.score === null);
    return firstUnscored === -1 ? 17 : firstUnscored;
  };

  const getTotalScore = () => {
    if (!round) return 0;
    return round.holes.reduce((sum, h) => sum + (h.score || 0), 0);
  };

  const getRelativeScore = () => {
    if (!round) return 0;
    const totalPar = round.holes.reduce((sum, h) => sum + h.par, 0);
    const totalScore = round.holes.reduce((sum, h) => sum + (h.score || 0), 0);
    return totalScore - totalPar;
  };

  const handleFinish = () => {
    if (!round) return;
    if (!confirm('라운드를 종료하시겠습니까?')) return;

    const completedRound = {
      ...round,
      date: new Date().toISOString(),
      totalScore: getTotalScore(),
      totalPar: round.holes.reduce((sum, h) => sum + h.par, 0),
      relativeScore: getRelativeScore(),
    };

    const savedRound = addRound(round.courseName);
    updateRound({ ...completedRound, id: savedRound.id });
    onComplete();
  };

  if (showCourseInput) {
    return (
      <div className="min-h-screen bg-surface pb-32">
        <header className="bg-surface-container-lowest flex justify-between items-center w-full px-6 py-4 sticky top-0 z-50">
          <button onClick={onBack} className="p-2 -ml-2">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
          <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">{t('newRound')}</p>
          <div className="w-10"></div>
        </header>

        <main className="px-6 pt-12 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⛳</span>
            </div>
            <h2 className="text-2xl font-extrabold text-primary font-headline mb-2">{t('startNewRound')}</h2>
            <p className="text-on-surface-variant">{t('enterCourseName')}</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder={t('courseName')}
              className="w-full bg-surface-container-lowest rounded-2xl py-5 px-6 text-lg text-on-surface outline-none text-center"
              onKeyDown={(e) => e.key === 'Enter' && handleStartRound()}
            />

            <button
              onClick={handleStartRound}
              className="w-full gradient-primary text-on-primary py-5 rounded-2xl font-bold text-lg active:scale-98 transition-transform"
            >
              {t('startRound')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!round) return null;

  const currentHoleIndex = getCurrentHoleIndex();
  const currentHole = round.holes[currentHoleIndex];
  const completedHoles = round.holes.filter(h => h.score !== null).length;
  const totalScore = getTotalScore();

  return (
    <div className="min-h-screen bg-surface pb-32">
      <header className="bg-surface-container-lowest flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <button onClick={onBack} className="p-2 -ml-2">
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </button>
        <div className="text-center">
          <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">{courseName}</p>
          <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">{t('totalScore')}</p>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-black font-headline ${getRelativeScore() < 0 ? 'score-lime' : getRelativeScore() > 0 ? 'text-error' : 'text-on-surface'}`}>
            {getRelativeScore() >= 0 ? '+' : ''}{getRelativeScore()}
          </span>
        </div>
      </header>

      {currentHole.score === null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-surface-container-lowest rounded-[2rem] p-12 text-center animate-bounce w-full max-w-sm">
            <p className="text-sm text-on-surface-variant mb-2">{t('hole')} {currentHoleIndex + 1}</p>
            <p className="text-6xl font-black font-headline text-primary mb-4">{currentHoleIndex + 1}</p>
            <p className="text-sm text-on-surface-variant mb-6">Par {currentHole.par}</p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[...Array(5)].map((_, i) => {
                const score = currentHole.par - 2 + i;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      const newHoles = [...round.holes];
                      newHoles[currentHoleIndex] = { ...newHoles[currentHoleIndex], score };
                      setRound({ ...round, holes: newHoles });
                    }}
                    className="aspect-square rounded-xl bg-surface-container font-bold text-lg text-on-surface active:scale-95 transition-transform"
                  >
                    {score}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => handleScoreInput(currentHoleIndex)}
              className="text-sm text-secondary underline"
            >
              다른 스코어 입력...
            </button>
          </div>
        </div>
      )}

      <main className="px-6 pt-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
            <p className="text-xs text-on-surface-variant font-bold">{t('holeCount')}</p>
            <p className="text-2xl font-black font-headline text-primary">{completedHoles}/18</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
            <p className="text-xs text-on-surface-variant font-bold">{t('totalScore')}</p>
            <p className="text-2xl font-black font-headline text-primary">{totalScore}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
            <p className="text-xs text-on-surface-variant font-bold">{t('par')}</p>
            <p className={`text-2xl font-black font-headline ${getRelativeScore() < 0 ? 'score-lime' : getRelativeScore() > 0 ? 'text-error' : 'text-on-surface'}`}>
              {getRelativeScore() >= 0 ? '+' : ''}{getRelativeScore()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {round.holes.map((hole, i) => (
            <button
              key={i}
              onClick={() => {
                if (hole.score === null) {
                  const input = prompt(`${i + 1}번 홀 스코어:`, '');
                  if (input) {
                    const score = parseInt(input);
                    if (!isNaN(score) && score >= 1 && score <= 15) {
                      const newHoles = [...round.holes];
                      newHoles[i] = { ...newHoles[i], score };
                      setRound({ ...round, holes: newHoles });
                    }
                  }
                }
              }}
              className={`aspect-square rounded-xl font-bold text-sm flex items-center justify-center transition-all active:scale-95 ${getScoreColor(hole.score, hole.par)}`}
            >
              {hole.score ?? i + 1}
            </button>
          ))}
        </div>

        <button
          onClick={handleFinish}
          className="w-full gradient-primary text-on-primary py-5 rounded-2xl font-bold text-lg mt-8 active:scale-98 transition-transform"
        >
          {t('finishRound')}
        </button>
      </main>
    </div>
  );
}
