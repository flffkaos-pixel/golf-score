import { useGolf } from '../hooks/useGolf';
import { formatDate, getScoreDisplay } from '../utils/storage';

interface HomeProps {
  onStartGame: () => void;
}

export default function Home({ onStartGame }: HomeProps) {
  const { data } = useGolf();
  
  const recentRounds = data.rounds.slice(0, 5);
  const totalRounds = data.rounds.length;
  const avgScore = totalRounds > 0 
    ? Math.round(data.rounds.reduce((sum, r) => sum + r.totalScore, 0) / totalRounds)
    : '-';

  return (
    <div className="min-h-screen">
      <header className="p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">⛳ Golf</h1>
        <p className="text-white/70">친구들과 경쟁해보세요!</p>
      </header>

      <div className="px-4 mb-6">
        <button
          onClick={onStartGame}
          className="w-full bg-green-500 text-white py-5 rounded-2xl font-bold text-xl shadow-lg active:scale-98 transition-transform flex items-center justify-center gap-3"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          새 라운드 시작
        </button>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-white">
          <div className="text-white/60 text-sm">총 라운드</div>
          <div className="text-3xl font-bold">{totalRounds}</div>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-white">
          <div className="text-white/60 text-sm">평균 스코어</div>
          <div className="text-3xl font-bold">{avgScore}</div>
        </div>
      </div>

      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-bold">최근 기록</h2>
        </div>

        {recentRounds.length === 0 ? (
          <div className="bg-white/10 backdrop-blur rounded-xl p-8 text-center">
            <div className="text-white/50 mb-2">아직 기록이 없어요</div>
            <div className="text-white/30 text-sm">첫 라운드를 시작해보세요!</div>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRounds.map(round => {
              const scoreDisplay = getScoreDisplay(round.relativeScore);
              return (
                <div key={round.id} className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-bold">{round.courseName}</div>
                    <div className={`font-bold ${scoreDisplay.color}`}>
                      {scoreDisplay.text}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-white/60">{formatDate(round.date)}</div>
                    <div className="text-white font-bold">{round.totalScore}타</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
