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

  const handleStart = () => {
    if (!courseName.trim()) return;
    const newRound = addRound(courseName.trim());
    setRound(newRound);
    setStep('score');
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

  const handleFinish = () => {
    onComplete();
  };

  const getScoreColor = (score: number, par: number) => {
    const diff = score - par;
    if (diff <= -2) return 'bg-blue-500';
    if (diff === -1) return 'bg-green-500';
    if (diff === 0) return 'bg-white';
    if (diff === 1) return 'bg-yellow-500';
    if (diff === 2) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (step === 'name') {
    return (
      <div className="min-h-screen p-4 flex flex-col">
        <header className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="text-white p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-bold">새 라운드</h1>
        </header>

        <div className="flex-1 flex flex-col justify-center">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
            <label className="block text-white/80 text-sm mb-2">코스 이름</label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="예: 하늘CC"
              className="w-full bg-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              onClick={handleStart}
              disabled={!courseName.trim()}
              className="w-full mt-6 bg-green-500 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
            >
              시작하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!round) return null;

  const currentHoleData = round.holes[currentHole];
  const completedHoles = round.holes.filter(h => h.score !== null).length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-900 to-green-950">
      <header className="flex items-center justify-between p-4 text-white">
        <button onClick={onBack} className="p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center">
          <div className="text-sm opacity-80">{courseName}</div>
          <div className="font-bold">{completedHoles}/18 홀</div>
        </div>
        <div className="text-right">
          <div className="text-sm opacity-80">총점</div>
          <div className={`font-bold ${round.relativeScore > 0 ? 'text-red-300' : round.relativeScore < 0 ? 'text-blue-300' : 'text-white'}`}>
            {round.totalScore}
            <span className="text-sm ml-1">
              ({round.relativeScore === 0 ? 'E' : round.relativeScore > 0 ? `+${round.relativeScore}` : round.relativeScore})
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center px-4">
        <div className="text-center mb-8">
          <div className="text-8xl font-bold text-white mb-2">{currentHole + 1}</div>
          <div className="text-white/60 text-lg">홀</div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-white/60">파</span>
            <select
              value={currentHoleData.par}
              onChange={(e) => {
                const newHoles = [...round.holes];
                newHoles[currentHole] = { ...newHoles[currentHole], par: parseInt(e.target.value) };
                const updated = { ...round, holes: newHoles };
                setRound(updated);
                updateRound(updated);
              }}
              className="bg-white/20 text-white text-center w-16 py-1 rounded-lg"
            >
              {[3, 4, 5].map(p => (
                <option key={p} value={p} className="text-black">{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(score => (
            <button
              key={score}
              onClick={() => updateScore(currentHole, score)}
              className={`aspect-square rounded-xl font-bold text-xl flex items-center justify-center transition-transform active:scale-95 ${getScoreColor(score, currentHoleData.par)} ${currentHoleData.score === score ? 'ring-4 ring-yellow-400' : ''}`}
              style={{ color: score > 5 ? '#000' : '#000' }}
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
              className={`aspect-square rounded-xl font-bold text-xl flex items-center justify-center transition-transform active:scale-95 ${getScoreColor(score, currentHoleData.par)}`}
            >
              {score}
            </button>
          ))}
          <button
            onClick={() => updateScore(currentHole, 0)}
            className="aspect-square rounded-xl bg-white/20 text-white/60 font-bold text-sm flex items-center justify-center"
          >
           DEL
          </button>
        </div>
      </div>

      <div className="p-4 flex gap-3">
        <button
          onClick={() => setCurrentHole(Math.max(0, currentHole - 1))}
          disabled={currentHole === 0}
          className="flex-1 bg-white/20 text-white py-4 rounded-xl font-bold disabled:opacity-30"
        >
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
          className="flex-1 bg-green-500 text-white py-4 rounded-xl font-bold"
        >
          {currentHole < 17 ? '다음' : '완료'}
        </button>
      </div>

      <div className="p-4 pb-8">
        <div className="flex gap-1 justify-center">
          {round.holes.map((hole, i) => (
            <button
              key={i}
              onClick={() => setCurrentHole(i)}
              className={`w-6 h-6 rounded text-xs font-bold transition-all ${
                i === currentHole ? 'bg-white text-green-900' :
                hole.score !== null ? 'bg-green-500 text-white' : 'bg-white/20 text-white/50'
              }`}
            >
              {hole.score !== null ? hole.score : i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
