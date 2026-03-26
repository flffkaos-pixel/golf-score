import { useState } from 'react';
import { useGolf } from '../hooks/useGolf';
import { calculateScore } from '../utils/storage';

interface PlayGameProps {
  onBack: () => void;
  onComplete: () => void;
}

export default function PlayGame({ onBack, onComplete }: PlayGameProps) {
  const { addRound, updateRound } = useGolf();
  const [courseName, setCourseName] = useState('');
  const [step, setStep] = useState<'name' | 'score'>('name');
  const [currentHole, setCurrentHole] = useState(0);
  const [round, setRound] = useState<ReturnType<typeof addRound> | null>(null);
  const [achievement, setAchievement] = useState<string | null>(null);

  const handleStart = () => {
    if (!courseName.trim()) return;
    const newRound = addRound(courseName.trim());
    setRound(newRound);
    setStep('score');
  };

  const updateScore = (holeIndex: number, score: number) => {
    if (!round) return;
    const newHoles = [...round.holes];
    const prevScore = newHoles[holeIndex].score;
    newHoles[holeIndex] = { ...newHoles[holeIndex], score };
    const calculated = calculateScore(newHoles);
    const updated = {
      ...round,
      holes: newHoles,
      ...calculated,
    };
    setRound(updated);
    updateRound(updated);

    if (prevScore === null && score !== null) {
      const diff = score - newHoles[holeIndex].par;
      if (diff <= -3) {
        setAchievement('홀인원!');
        setTimeout(() => setAchievement(null), 3000);
      } else if (diff === -2) {
        setAchievement('이글!');
        setTimeout(() => setAchievement(null), 2000);
      } else if (diff === -1) {
        setAchievement('버디!');
        setTimeout(() => setAchievement(null), 2000);
      } else if (diff === 0) {
        setAchievement('파!');
        setTimeout(() => setAchievement(null), 1500);
      }
    }
  };

  const handleFinish = () => {
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
          <h1 className="text-xl font-extrabold text-primary font-headline">새 라운딩</h1>
          <div className="w-10"></div>
        </header>

        <main className="px-6 pt-8 max-w-md mx-auto">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-3 font-headline">
                골프장 이름
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="예: 남부 컨트리클럽"
                className="w-full bg-surface-container-low border-none rounded-2xl py-5 px-6 text-lg outline-none focus:ring-2 focus:ring-secondary-container transition-all placeholder:text-outline/60 font-body"
              />
            </div>

            <button
              onClick={handleStart}
              disabled={!courseName.trim()}
              className="w-full bg-primary text-white py-5 rounded-2xl font-headline font-extrabold text-lg shadow-lg active:scale-98 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              라운딩 시작
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!round) return null;

  const currentHoleData = round.holes[currentHole];
  const completedHoles = round.holes.filter(h => h.score !== null).length;

  return (
    <div className="min-h-screen bg-surface pb-32">
      {achievement && (
        <div className="fixed inset-0 bg-primary/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-[2rem] p-12 text-center animate-bounce">
            <div className="w-20 h-20 bg-tertiary-fixed rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⛳</span>
            </div>
            <div className="text-4xl font-extrabold text-primary font-headline mb-2">{achievement}</div>
            <div className="text-stone-500">훌륭해요!</div>
          </div>
        </div>
      )}

      <header className="bg-white flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <button onClick={onBack} className="p-2 -ml-2">
          <span className="material-symbols-outlined text-stone-500">close</span>
        </button>
        <div className="text-center">
          <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">{courseName}</p>
          <p className="text-lg font-bold text-primary font-headline">{completedHoles}/18 홀</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">총점</p>
          <p className={`text-lg font-bold font-headline ${
            round.relativeScore > 0 ? 'text-error' : 
            round.relativeScore < 0 ? 'text-secondary' : 'text-stone-600'
          }`}>
            {round.totalScore}
          </p>
        </div>
      </header>

      <main className="pt-6 px-4 max-w-md mx-auto">
        <section className="relative overflow-hidden rounded-[1.5rem] bg-primary text-white p-6 mb-8 shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary-fixed/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-2">
              <h2 className="text-4xl font-extrabold font-headline">
                {currentHole + 1}번 홀
              </h2>
              <div className="bg-tertiary-fixed text-tertiary px-4 py-1 rounded-full font-bold text-lg">
                Par {currentHoleData.par}
              </div>
            </div>
            <div className="flex items-center gap-2 text-primary-fixed/80 font-medium">
              <span className="material-symbols-outlined text-sm">flag</span>
              <span>홀 선택</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {[3, 4, 5].map(par => (
            <button
              key={par}
              onClick={() => {
                const newHoles = [...round.holes];
                newHoles[currentHole] = { ...newHoles[currentHole], par };
                const updated = { ...round, holes: newHoles };
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
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(score => (
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
          {[13, 14, 15, 16, 17].map(score => (
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

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => setCurrentHole(Math.max(0, currentHole - 1))}
            disabled={currentHole === 0}
            className="flex-1 bg-surface-container text-on-surface-variant font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-30"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            이전
          </button>
          <button
            onClick={() => {
              if (currentHole < 17) {
                setCurrentHole(currentHole + 1);
              } else {
                handleFinish();
              }
            }}
            className="flex-2 bg-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-transform flex-[2]"
          >
            {currentHole < 17 ? (
              <>
                다음
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            ) : (
              <>
                끝내기
                <span className="material-symbols-outlined">check_circle</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 mt-6">
          <div className="flex gap-1 justify-center overflow-x-auto hide-scrollbar">
            {round.holes.map((hole, i) => (
              <button
                key={i}
                onClick={() => setCurrentHole(i)}
                className={`min-w-[2rem] h-10 rounded-xl text-sm font-bold transition-all ${
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
