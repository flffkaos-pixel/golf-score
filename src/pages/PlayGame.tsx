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
  const [showScorePopup, setShowScorePopup] = useState(false);
  const [currentInputHole, setCurrentInputHole] = useState(0);
  const [achievement, setAchievement] = useState<{type: string; icon: string} | null>(null);

  const getScoreColor = (score: number | null, par: number) => {
    if (score === null) return 'bg-surface-container text-on-surface-variant';
    const diff = score - par;
    if (diff <= -3) return 'bg-purple-500 text-white';
    if (diff === -2) return 'bg-secondary text-on-secondary';
    if (diff === -1) return 'bg-secondary text-on-secondary';
    if (diff === 0) return 'bg-surface-container-low text-on-surface';
    if (diff === 1) return 'bg-secondary-container text-on-secondary-container';
    if (diff === 2) return 'bg-secondary-container text-on-secondary-container';
    return 'bg-error-container text-error';
  };

  const showAchievement = (type: string, icon: string) => {
    setAchievement({ type, icon });
    setTimeout(() => setAchievement(null), 2000);
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

  const handleScoreSelect = (score: number) => {
    if (!round) return;
    const hole = round.holes[currentInputHole];
    const diff = score - hole.par;
    
    if (diff <= -3) showAchievement('holeInOne', '🎯');
    else if (diff === -2) showAchievement('eagle', '🦅');
    else if (diff === -1) showAchievement('birdie', '🐦');
    else if (diff === 0) showAchievement('par', '⛳');
    else if (diff === 1) showAchievement('bogey', '😅');
    else if (diff === 2) showAchievement('double', '😅+');

    const newHoles = [...round.holes];
    newHoles[currentInputHole] = { ...newHoles[currentInputHole], score };
    setRound({ ...round, holes: newHoles });
    setShowScorePopup(false);
  };

  const handleScoreInput = (holeIndex: number) => {
    setCurrentInputHole(holeIndex);
    setShowScorePopup(true);
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

  const getAchievementLabel = (type: string) => {
    switch (type) {
      case 'holeInOne': return t('holeInOne');
      case 'eagle': return t('eagle');
      case 'birdie': return t('birdie');
      case 'par': return t('par');
      case 'bogey': return '보기';
      case 'double': return '더블보기';
      default: return '';
    }
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

  const scoreOptions = [];
  for (let i = -2; i <= 4; i++) {
    const score = currentHole.par + i;
    if (score >= 1) {
      scoreOptions.push({ score, label: i === -2 ? 'E-2' : i === -1 ? 'E-1' : i === 0 ? 'Par' : `+${i}` });
    }
  }

  return (
    <div className="min-h-screen bg-surface pb-32">
      {achievement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="bg-gradient-to-br from-secondary to-secondary-container rounded-[2rem] p-8 text-center animate-bounce shadow-2xl">
            <div className="text-6xl mb-2">{achievement.icon}</div>
            <p className="text-xl font-bold text-on-secondary font-headline">{getAchievementLabel(achievement.type)}</p>
          </div>
        </div>
      )}

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

      {showScorePopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-surface-container-lowest rounded-[2rem] p-8 w-full max-w-sm">
            <p className="text-sm text-on-surface-variant mb-2 text-center">HOLE {currentInputHole + 1}</p>
            <p className="text-5xl font-black font-headline text-primary mb-2 text-center">{currentInputHole + 1}</p>
            <p className="text-on-surface-variant mb-6 text-center">Par {round.holes[currentInputHole].par}</p>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              {scoreOptions.slice(0, 6).map((opt, i) => {
                const actualScore = opt.score;
                const diff = actualScore - round.holes[currentInputHole].par;
                let bgColor = 'bg-surface-container';
                let textColor = 'text-on-surface';
                if (diff <= -2) { bgColor = 'bg-secondary'; textColor = 'text-on-secondary'; }
                else if (diff === -1) { bgColor = 'bg-secondary'; textColor = 'text-on-secondary'; }
                else if (diff === 0) { bgColor = 'bg-surface-container-high'; textColor = 'text-on-surface'; }
                else if (diff === 1) { bgColor = 'bg-secondary-container'; textColor = 'text-on-secondary-container'; }
                else if (diff >= 2) { bgColor = 'bg-error-container'; textColor = 'text-error'; }
                
                return (
                  <button
                    key={i}
                    onClick={() => handleScoreSelect(actualScore)}
                    className={`${bgColor} ${textColor} py-4 rounded-xl font-bold text-lg active:scale-95 transition-transform`}
                  >
                    {actualScore}
                  </button>
                );
              })}
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              {scoreOptions.slice(6).map((opt, i) => {
                const actualScore = opt.score;
                return (
                  <button
                    key={i + 6}
                    onClick={() => handleScoreSelect(actualScore)}
                    className="bg-surface-container text-on-surface py-4 rounded-xl font-bold text-lg active:scale-95 transition-transform"
                  >
                    {actualScore}
                  </button>
                );
              })}
              {scoreOptions.length < 7 && [...Array(6 - scoreOptions.length)].map((_, i) => (
                <div key={`empty-${i}`} className="py-4"></div>
              ))}
            </div>

            <button
              onClick={() => setShowScorePopup(false)}
              className="w-full py-3 text-on-surface-variant font-bold"
            >
              취소
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
              onClick={() => handleScoreInput(i)}
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
