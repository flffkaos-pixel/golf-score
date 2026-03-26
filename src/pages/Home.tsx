import { useState } from 'react';
import { useGolf } from '../hooks/useGolf';
import { formatDate, getScoreDisplay } from '../utils/storage';

interface HomeProps {
  onStartGame: () => void;
}

export default function Home({ onStartGame }: HomeProps) {
  const { data, deleteRound, addSampleData, clearAllData } = useGolf();
  const [devMode, setDevMode] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  
  const recentRounds = data.rounds.slice(0, 10);
  const totalRounds = data.rounds.length;
  const avgScore = totalRounds > 0 
    ? Math.round(data.rounds.reduce((sum, r) => sum + r.totalScore, 0) / totalRounds)
    : '-';

  const handleTitleTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= 5) {
      setDevMode(true);
      setTapCount(0);
    }
    setTimeout(() => setTapCount(0), 1000);
  };

  const handleDelete = (id: string) => {
    if (confirm('이 기록을 삭제할까요?')) {
      deleteRound(id);
    }
  };

  const getAchievements = (round: typeof data.rounds[0]) => {
    const achievements: string[] = [];
    round.holes.forEach(hole => {
      if (hole.score !== null) {
        const diff = hole.score - hole.par;
        if (diff <= -3) achievements.push('🦅 홀인원!');
        else if (diff === -2) achievements.push('🦅 이글!');
        else if (diff === -1) achievements.push('🐦 버디!');
      }
    });
    return achievements;
  };

  const shareScore = async (round: typeof data.rounds[0]) => {
    const scoreDisplay = getScoreDisplay(round.relativeScore);
    const text = `⛳ Golfie에서 라운드 완료!\n\n📍 ${round.courseName}\n🏌️ ${round.totalScore}타 (${scoreDisplay.text})\n📅 ${formatDate(round.date)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('클립보드에 복사되었어요!');
    }
  };

  return (
    <div className="min-h-screen">
      {devMode && (
        <div className="bg-red-600 text-white px-4 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span>🔧 개발자 모드</span>
            <button onClick={() => setDevMode(false)}>✕</button>
          </div>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={addSampleData}
              className="bg-white/20 px-3 py-1 rounded text-xs"
            >
              📊 샘플 데이터 추가
            </button>
            <button 
              onClick={clearAllData}
              className="bg-red-800 px-3 py-1 rounded text-xs"
            >
              🗑️ 전체 삭제
            </button>
          </div>
        </div>
      )}

      <header className="p-6 text-white">
        <button onClick={handleTitleTap} className="text-left">
          <h1 className="text-3xl font-bold mb-2">⛳ Golfie</h1>
        </button>
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
          {totalRounds > 0 && (
            <span className="text-white/50 text-sm">{totalRounds}개 전체</span>
          )}
        </div>

        {recentRounds.length === 0 ? (
          <div className="bg-white/10 backdrop-blur rounded-xl p-8 text-center">
            <div className="text-white/50 mb-2">아직 기록이 없어요</div>
            <div className="text-white/30 text-sm">첫 라운드를 시작해보세요!</div>
            {!devMode && (
              <div className="mt-4 text-white/30 text-xs">💡 테스트: 타이틀 5회 탭</div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {recentRounds.map(round => {
              const scoreDisplay = getScoreDisplay(round.relativeScore);
              const achievements = getAchievements(round);
              return (
                <div key={round.id} className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-white font-bold">{round.courseName}</div>
                      <div className="text-white/50 text-sm">{formatDate(round.date)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => shareScore(round)}
                        className="text-blue-400 p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="공유하기"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(round.id)}
                        className="text-red-400 p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-white font-bold text-2xl">{round.totalScore}타</div>
                    <div className={`text-xl font-bold ${scoreDisplay.color}`}>
                      {scoreDisplay.text}
                    </div>
                  </div>

                  {achievements.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {achievements.slice(0, 5).map((achievement, i) => (
                        <span key={i} className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full">
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
      </div>
    </div>
  );
}
