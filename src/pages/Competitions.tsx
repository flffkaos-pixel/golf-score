import { useState } from 'react';
import { useGolf } from '../hooks/useGolf';
import { formatDate, getScoreDisplay } from '../utils/storage';

interface CompetitionsProps {
  onBack: () => void;
}

export default function Competitions({ onBack }: CompetitionsProps) {
  const { data, createCompetition, joinCompetition } = useGolf();
  const [showCreate, setShowCreate] = useState(false);
  const [newCompName, setNewCompName] = useState('');

  const handleCreate = () => {
    if (!newCompName.trim()) return;
    createCompetition(newCompName.trim());
    setNewCompName('');
    setShowCreate(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'finished': return 'bg-gray-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '진행중';
      case 'finished': return '종료';
      default: return '대기중';
    }
  };

  const activeComps = data.competitions.filter(c => c.status !== 'finished');

  return (
    <div className="min-h-screen p-4">
      <header className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-white p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white text-xl font-bold">대회</h1>
      </header>

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-4 mb-6">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="w-full bg-white text-purple-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          새 대회 만들기
        </button>
      </div>

      {showCreate && (
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
          <input
            type="text"
            value={newCompName}
            onChange={(e) => setNewCompName(e.target.value)}
            placeholder="대회 이름 (예: 3월 Monthly)"
            className="w-full bg-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 outline-none mb-3"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 bg-white/20 text-white py-3 rounded-xl font-bold"
            >
              취소
            </button>
            <button
              onClick={handleCreate}
              disabled={!newCompName.trim()}
              className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold disabled:opacity-50"
            >
              만들기
            </button>
          </div>
        </div>
      )}

      <h2 className="text-white font-bold mb-4">진행중인 대회</h2>

      {activeComps.length === 0 ? (
        <div className="bg-white/10 backdrop-blur rounded-xl p-8 text-center">
          <div className="text-white/50 mb-2">진행중인 대회가 없어요</div>
          <div className="text-white/30 text-sm">새 대회를 만들어 친구들을 초대하세요!</div>
        </div>
      ) : (
        <div className="space-y-4">
          {activeComps.map(comp => (
            <div key={comp.id} className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-bold text-lg">{comp.name}</h3>
                  <p className="text-white/50 text-sm">{formatDate(comp.startDate)}</p>
                </div>
                <span className={`${getStatusColor(comp.status)} text-white text-xs px-2 py-1 rounded-full`}>
                  {getStatusText(comp.status)}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="text-white/60 text-sm">참가자</div>
                <div className="flex -space-x-2">
                  {comp.players.map((player, i) => (
                    <div
                      key={player.id}
                      className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-green-900"
                      style={{ zIndex: comp.players.length - i }}
                    >
                      {player.name[0].toUpperCase()}
                    </div>
                  ))}
                </div>
                <span className="text-white/60 text-sm">{comp.players.length}명</span>
              </div>

              {comp.rounds.length > 0 && (
                <div className="bg-white/5 rounded-lg p-3 mb-3">
                  <div className="text-white/60 text-xs mb-2">현재 순위</div>
                  {comp.rounds
                    .sort((a, b) => a.relativeScore - b.relativeScore)
                    .slice(0, 3)
                    .map((round, i) => {
                      const player = comp.players.find(p => p.id === round.id) || { name: 'Unknown' };
                      const scoreDisplay = getScoreDisplay(round.relativeScore);
                      return (
                        <div key={round.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              i === 0 ? 'bg-yellow-500 text-black' : 
                              i === 1 ? 'bg-gray-300 text-black' : 
                              i === 2 ? 'bg-amber-600 text-white' : 'bg-white/20 text-white'
                            }`}>
                              {i + 1}
                            </span>
                            <span className="text-white">{player.name}</span>
                          </div>
                          <span className={`font-bold ${scoreDisplay.color}`}>
                            {round.totalScore} ({scoreDisplay.text})
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}

              {!comp.players.find(p => p.id === data.player.id) && (
                <button
                  onClick={() => joinCompetition(comp.id)}
                  className="w-full bg-green-500 text-white py-3 rounded-xl font-bold"
                >
                  참가하기
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {data.competitions.filter(c => c.status === 'finished').length > 0 && (
        <>
          <h2 className="text-white font-bold mb-4 mt-6">종료된 대회</h2>
          <div className="space-y-3">
            {data.competitions
              .filter(c => c.status === 'finished')
              .map(comp => (
                <div key={comp.id} className="bg-white/5 backdrop-blur rounded-xl p-4 opacity-70">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold">{comp.name}</h3>
                      <p className="text-white/50 text-sm">{formatDate(comp.startDate)}</p>
                    </div>
                    <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                      종료
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
