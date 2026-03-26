import { useState } from 'react';
import { useGolf } from '../hooks/useGolf';

interface FriendsProps {
  onBack: () => void;
}

export default function Friends({ onBack }: FriendsProps) {
  const { data, addFriend, removeFriend } = useGolf();
  const [newFriend, setNewFriend] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = () => {
    if (!newFriend.trim()) return;
    addFriend(newFriend.trim());
    setNewFriend('');
    setShowAdd(false);
  };

  const generateInviteCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigator.clipboard.writeText(code);
    alert(`초대 코드: ${code}\n클립보드에 복사되었습니다!`);
  };

  return (
    <div className="min-h-screen p-4">
      <header className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-white p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white text-xl font-bold">친구</h1>
      </header>

      <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-6">
        <button
          onClick={generateInviteCode}
          className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          친구 초대하기
        </button>
        <p className="text-white/50 text-sm text-center mt-2">
          초대 코드를 보내서 친구와 연결하세요
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold">내 친구 ({data.friends.length})</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-green-400 font-bold"
        >
          {showAdd ? '취소' : '+ 추가'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
          <input
            type="text"
            value={newFriend}
            onChange={(e) => setNewFriend(e.target.value)}
            placeholder="친구 이름"
            className="w-full bg-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 outline-none mb-3"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={!newFriend.trim()}
            className="w-full bg-green-500 text-white py-3 rounded-xl font-bold disabled:opacity-50"
          >
            추가
          </button>
        </div>
      )}

      {data.friends.length === 0 ? (
        <div className="bg-white/10 backdrop-blur rounded-xl p-8 text-center">
          <div className="text-white/50 mb-2">아직 친구가 없어요</div>
          <div className="text-white/30 text-sm">초대 코드를 공유하거나 친구를 추가하세요!</div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.friends.map(friend => (
            <div key={friend.id} className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {friend.name[0].toUpperCase()}
                </div>
                <span className="text-white font-bold">{friend.name}</span>
              </div>
              <button
                onClick={() => removeFriend(friend.id)}
                className="text-red-400 p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
