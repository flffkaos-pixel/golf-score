import { useGolf } from '../hooks/useGolf';
import { formatDate, getScoreDisplay } from '../utils/storage';

interface StatsProps {
  onBack: () => void;
}

export default function Stats({ onBack }: StatsProps) {
  const { data } = useGolf();

  const totalRounds = data.rounds.length;
  const avgScore = totalRounds > 0
    ? (data.rounds.reduce((sum, r) => sum + r.totalScore, 0) / totalRounds).toFixed(1)
    : '-';
  
  const bestScore = totalRounds > 0
    ? Math.min(...data.rounds.map(r => r.totalScore))
    : '-';
  
  const avgRelative = totalRounds > 0
    ? (data.rounds.reduce((sum, r) => sum + r.relativeScore, 0) / totalRounds).toFixed(1)
    : '-';

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

  const totalHoles = data.rounds.reduce((count, round) => {
    return count + round.holes.filter(h => h.score !== null).length;
  }, 0);

  const sortedByScore = [...data.rounds].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="min-h-screen p-4 pb-20">
      <header className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-white p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white text-xl font-bold">통계</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
          <div className="text-white/60 text-sm">평균 스코어</div>
          <div className="text-4xl font-bold text-white">{avgScore}</div>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
          <div className="text-white/60 text-sm">최고 기록</div>
          <div className="text-4xl font-bold text-green-400">{bestScore}</div>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
          <div className="text-white/60 text-sm">평균 타수</div>
          <div className="text-4xl font-bold text-white">{avgRelative}</div>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
          <div className="text-white/60 text-sm">총 라운드</div>
          <div className="text-4xl font-bold text-white">{totalRounds}</div>
        </div>
      </div>

      <h2 className="text-white font-bold mb-4">홀 성적 분포</h2>
      <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-20 text-white text-sm">이글 이하</div>
            <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
              <div 
                className="h-full bg-blue-500" 
                style={{ width: `${totalHoles > 0 ? (eaglesOrBetter / totalHoles) * 100 : 0}%` }}
              />
            </div>
            <div className="w-12 text-white text-sm text-right">{eaglesOrBetter}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 text-white text-sm">버디</div>
            <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
              <div 
                className="h-full bg-green-500" 
                style={{ width: `${totalHoles > 0 ? (birdies / totalHoles) * 100 : 0}%` }}
              />
            </div>
            <div className="w-12 text-white text-sm text-right">{birdies}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 text-white text-sm">파</div>
            <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
              <div 
                className="h-full bg-white" 
                style={{ width: `${totalHoles > 0 ? (pars / totalHoles) * 100 : 0}%` }}
              />
            </div>
            <div className="w-12 text-white text-sm text-right">{pars}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 text-white text-sm">보기</div>
            <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
              <div 
                className="h-full bg-yellow-500" 
                style={{ width: `${totalHoles > 0 ? (bogeys / totalHoles) * 100 : 0}%` }}
              />
            </div>
            <div className="w-12 text-white text-sm text-right">{bogeys}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 text-white text-sm">더블+</div>
            <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
              <div 
                className="h-full bg-red-500" 
                style={{ width: `${totalHoles > 0 ? (doubleBogeyOrWorse / totalHoles) * 100 : 0}%` }}
              />
            </div>
            <div className="w-12 text-white text-sm text-right">{doubleBogeyOrWorse}</div>
          </div>
        </div>
      </div>

      <h2 className="text-white font-bold mb-4">개인 기록</h2>
      {data.rounds.length === 0 ? (
        <div className="bg-white/10 backdrop-blur rounded-xl p-8 text-center">
          <div className="text-white/50">아직 기록이 없어요</div>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedByScore.slice(0, 10).map((round) => {
            const scoreDisplay = getScoreDisplay(round.relativeScore);
            return (
              <div key={round.id} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold">{round.courseName}</div>
                    <div className="text-white/50 text-sm">{formatDate(round.date)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-xl">{round.totalScore}</div>
                    <div className={`text-sm ${scoreDisplay.color}`}>{scoreDisplay.text}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
