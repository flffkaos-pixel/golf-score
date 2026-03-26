import { useState } from 'react';
import { useGolf } from '../hooks/useGolf';
import { formatDate, getScoreDisplay } from '../utils/storage';

interface HomeProps {
  onStartGame: () => void;
}

export default function Home({ onStartGame }: HomeProps) {
  const { data, deleteRound, addSampleData, clearAllData } = useGolf();
  const [devMode, setDevMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const recentRounds = data.rounds.slice(0, 5);
  const totalRounds = data.rounds.length;
  const avgScore = totalRounds > 0 
    ? Math.round(data.rounds.reduce((sum, r) => sum + r.totalScore, 0) / totalRounds)
    : 0;

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
        if (diff <= -3) achievements.push('홀인원');
        else if (diff === -2) achievements.push('이글');
        else if (diff === -1) achievements.push('버디');
      }
    });
    return achievements;
  };

  const shareScore = async (round: typeof data.rounds[0]) => {
    const scoreDisplay = getScoreDisplay(round.relativeScore);
    const text = `⛳ GreenScore에서 라운드 완료!\n\n📍 ${round.courseName}\n🏌️ ${round.totalScore}타 (${scoreDisplay.text})\n📅 ${formatDate(round.date)}`;
    
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
    <div className="min-h-screen pb-32 bg-surface dark:bg-stone-900">
      {devMode && (
        <div className="bg-red-600 text-white px-4 py-2 text-sm">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <span>🔧 개발자 모드</span>
            <button onClick={() => setDevMode(false)}>✕</button>
          </div>
          <div className="flex gap-2 mt-2 max-w-5xl mx-auto">
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

      <header className="bg-white dark:bg-stone-950 flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
            <span className="text-primary text-lg">⛳</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-lg text-primary dark:text-white">{data.player.name}</span>
            <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">
              핸디캡 {avgScore > 0 ? (avgScore - 72).toFixed(1) : '-'}
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary dark:text-white font-headline">
          GreenScore
        </h1>
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="text-stone-400 p-2 rounded-full active:scale-95 transition-transform relative"
        >
          <span className="material-symbols-outlined">notifications</span>
          {data.friends.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
      </header>

      {showNotifications && (
        <div className="absolute top-16 right-4 w-72 bg-white dark:bg-stone-800 rounded-2xl shadow-xl z-50 p-4">
          <h3 className="font-bold text-primary dark:text-white mb-3">알림</h3>
          {data.friends.length === 0 ? (
            <p className="text-stone-500 text-sm">친구를 추가하면他们的 라운딩 알림을 받을 수 있어요!</p>
          ) : (
            <div className="space-y-2">
              {data.friends.slice(0, 3).map(friend => (
                <div key={friend.id} className="flex items-center gap-3 p-2 bg-surface-container dark:bg-stone-700 rounded-xl">
                  <div className="w-8 h-8 bg-secondary-container rounded-full flex items-center justify-center text-xs font-bold">
                    {friend.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium dark:text-white">{friend.name}</p>
                    <p className="text-xs text-stone-500">라운딩 준비중</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <main className="px-6 pt-6 space-y-8 max-w-5xl mx-auto">
        <section className="relative overflow-hidden rounded-[2rem] bg-primary dark:bg-primary-container text-white p-8 min-h-[180px] flex flex-col justify-end group">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-tertiary-fixed opacity-10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-primary-fixed-dim text-sm font-semibold tracking-wider">내 성적 요약</span>
            <h2 className="text-5xl font-extrabold font-headline leading-none tracking-tight">
              {avgScore > 0 ? avgScore : '-'}
              <span className="text-2xl font-medium ml-2 text-primary-fixed opacity-80">평균 타수</span>
            </h2>
            <p className="text-primary-fixed-dim/80 text-sm mt-2 font-medium">
              {totalRounds > 0 ? `지난 ${totalRounds}번의 라운딩 기준` : '아직 기록이 없습니다'}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold font-headline text-primary dark:text-white tracking-tight">최근 라운딩</h2>
            <button 
              onClick={onStartGame}
              className="bg-primary dark:bg-secondary text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              새 라운딩
            </button>
          </div>

          {recentRounds.length === 0 ? (
            <div className="bg-surface-container-lowest dark:bg-stone-800 rounded-[2rem] p-8 text-center">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-outline">golf_course</span>
              </div>
              <div className="text-stone-500 mb-2 font-semibold">아직 기록이 없어요</div>
              <div className="text-stone-400 text-sm">첫 라운드를 시작해보세요!</div>
              {!devMode && (
                <div className="mt-4 text-stone-400 text-xs">💡 테스트: 타이틀 5회 탭</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {recentRounds.map(round => {
                const achievements = getAchievements(round);
                const dateStr = new Date(round.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }).replace('년 ', '.').replace('월 ', '.').replace('일', '');
                
              return (
                <div key={round.id} className="bg-surface-container-lowest dark:bg-stone-800 rounded-[1.5rem] p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{dateStr}</p>
                      <h3 className="text-lg font-bold text-primary dark:text-white font-headline">{round.courseName}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-headline text-primary dark:text-white">{round.totalScore}</span>
                      <p className={`text-sm font-bold ${getScoreDisplay(round.relativeScore).color}`}>
                        {getScoreDisplay(round.relativeScore).text}
                      </p>
                    </div>
                  </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-surface-container-low dark:bg-stone-700 rounded-xl py-3 px-2 text-center">
                        <p className="text-[10px] text-stone-500 font-bold mb-1">퍼팅</p>
                        <p className="text-lg font-bold text-primary dark:text-white font-headline">-</p>
                      </div>
                      <div className="bg-surface-container-low dark:bg-stone-700 rounded-xl py-3 px-2 text-center">
                        <p className="text-[10px] text-stone-500 font-bold mb-1">파</p>
                        <p className="text-lg font-bold text-primary dark:text-white font-headline">{round.holes.filter(h => h.score === h.par).length}</p>
                      </div>
                      <div className="bg-surface-container-low dark:bg-stone-700 rounded-xl py-3 px-2 text-center">
                        <p className="text-[10px] text-stone-500 font-bold mb-1">버디+</p>
                        <p className="text-lg font-bold text-primary dark:text-white font-headline">{round.holes.filter(h => h.score !== null && h.score < h.par).length}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => shareScore(round)}
                        className="flex-1 bg-primary dark:bg-secondary text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                      >
                        <span className="material-symbols-outlined">share</span>
                        공유하기
                      </button>
                      <button
                        onClick={() => handleDelete(round.id)}
                        className="bg-error-container text-error px-4 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>

                    {achievements.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {achievements.slice(0, 5).map((achievement, i) => (
                          <span key={i} className="bg-tertiary-fixed/20 text-tertiary dark:bg-lime-500/20 dark:text-lime-400 px-3 py-1 rounded-full text-xs font-bold">
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
        </section>
      </main>
    </div>
  );
}
