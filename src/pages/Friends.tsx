import { useState } from 'react';
import { useGolf } from '../hooks/useGolf';
import { useAppSettings } from '../hooks/useAppSettings';
import { useAuth } from '../hooks/useAuth';

interface FriendsProps {
  onBack: () => void;
}

export default function Friends({ onBack }: FriendsProps) {
  const { data, addFriend, removeFriend, updateFriend } = useGolf();
  const { t } = useAppSettings();
  const { user } = useAuth();
  const [newFriend, setNewFriend] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showRedeem, setShowRedeem] = useState(false);

  const handleAdd = () => {
    if (!newFriend.trim()) return;
    addFriend(newFriend.trim());
    setNewFriend('');
    setShowAdd(false);
  };

  const handleEditStart = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleEditSave = (id: string) => {
    if (editName.trim()) {
      updateFriend(id, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigator.clipboard.writeText(code);
    alert(`초대 코드: ${code}\n클립보드에 복사되었습니다!`);
  };

  const handleRedeem = () => {
    if (!inviteCode.trim()) return;
    const code = inviteCode.trim().toUpperCase();
    const exists = data.friends.some(f => f.userId === code);
    if (exists) {
      alert('이미 추가된 친구입니다.');
    } else {
      addFriend(code, code);
      alert('친구 추가 완료!');
    }
    setInviteCode('');
    setShowRedeem(false);
  };

  return (
    <div className="min-h-screen bg-surface pb-32">
      <header className="bg-white flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <button onClick={onBack} className="p-2 -ml-2">
          <span className="material-symbols-outlined text-stone-500">arrow_back</span>
        </button>
        <h1 className="text-xl font-extrabold text-primary font-headline">{t('friends')}</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-6 pt-6 max-w-5xl mx-auto">
        {user && (
          <button
            onClick={generateCode}
            className="w-full bg-secondary text-white py-4 rounded-2xl font-headline font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-lg mb-3"
          >
            <span className="material-symbols-outlined">share</span>
            내 초대 코드 만들기
          </button>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex-1 bg-primary text-white py-3 rounded-2xl font-headline font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-lg"
          >
            <span className="material-symbols-outlined">person_add</span>
            {showAdd ? '취소' : '친구 추가'}
          </button>
          <button
            onClick={() => setShowRedeem(!showRedeem)}
            className="flex-1 bg-tertiary text-white py-3 rounded-2xl font-headline font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-lg"
          >
            <span className="material-symbols-outlined">vpn_key</span>
            코드 입력
          </button>
        </div>

        {showAdd && (
          <div className="bg-surface-container-lowest rounded-2xl p-6 mt-3">
            <input
              type="text"
              value={newFriend}
              onChange={(e) => setNewFriend(e.target.value)}
              placeholder="친구 이름"
              className="w-full bg-surface-container border-none rounded-xl px-4 py-4 outline-none mb-4 text-lg text-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={!newFriend.trim()}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold disabled:opacity-50 active:scale-98 transition-transform"
            >
              추가하기
            </button>
          </div>
        )}

        {showRedeem && (
          <div className="bg-surface-container-lowest rounded-2xl p-6 mt-3">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="초대 코드 입력"
              className="w-full bg-surface-container border-none rounded-xl px-4 py-4 outline-none mb-4 text-lg text-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
            />
            <button
              onClick={handleRedeem}
              disabled={!inviteCode.trim()}
              className="w-full bg-tertiary text-white py-4 rounded-xl font-bold disabled:opacity-50 active:scale-98 transition-transform"
            >
              친구 추가
            </button>
          </div>
        )}

        <div className="mt-8">
          <h2 className="font-headline font-bold text-lg mb-4">
            {t('myFriends')} ({data.friends.length})
          </h2>

          {data.friends.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-outline">group_add</span>
              </div>
              <div className="text-stone-500 mb-2 font-semibold">{t('noFriends')}</div>
              <div className="text-stone-400 text-sm">{t('addFriendHint')}</div>
            </div>
          ) : (
            <div className="space-y-3">
              {data.friends.map(friend => (
                <div key={friend.id} className="bg-surface-container-lowest rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center text-secondary font-bold text-lg font-headline">
                      {friend.name[0].toUpperCase()}
                    </div>
                    {editingId === friend.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditSave(friend.id)}
                        className="flex-1 bg-surface-container border-none rounded-xl px-4 py-2 outline-none text-lg text-primary font-headline"
                        autoFocus
                      />
                    ) : (
                      <span className="font-bold text-primary font-headline text-lg">{friend.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === friend.id ? (
                      <button
                        onClick={() => handleEditSave(friend.id)}
                        className="text-secondary p-3 bg-secondary-container rounded-xl active:scale-95 transition-transform"
                      >
                        <span className="material-symbols-outlined">check</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEditStart(friend.id, friend.name)}
                        className="text-primary p-3 bg-surface-container rounded-xl active:scale-95 transition-transform"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('정말 삭제하시겠습니까?')) {
                          removeFriend(friend.id);
                        }
                      }}
                      className="text-error p-3 bg-error-container rounded-xl active:scale-95 transition-transform"
                    >
                      <span className="material-symbols-outlined">person_remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
