import { useState } from 'react';
import { useGolf } from '../hooks/useGolf';
import { useAppSettings } from '../hooks/useAppSettings';

interface FriendsProps {
  onBack: () => void;
}

export default function Friends({ onBack }: FriendsProps) {
  const { data, addFriend, removeFriend } = useGolf();
  const { t } = useAppSettings();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if (newName.trim()) {
      addFriend(newName.trim());
      setNewName('');
      setShowAdd(false);
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-surface">
      <header className="bg-surface-container-lowest flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <button onClick={onBack} className="p-2 -ml-2">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </button>
        <h1 className="text-xl font-extrabold text-primary font-headline">{t('friends')}</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="p-2">
          <span className="material-symbols-outlined text-secondary">person_add</span>
        </button>
      </header>

      <main className="px-6 pt-6 max-w-5xl mx-auto">
        {showAdd && (
          <div className="mb-6 bg-surface-container-lowest rounded-2xl p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('friendName')}
                className="flex-1 bg-surface-container rounded-xl py-3 px-4 text-on-surface outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <button
                onClick={handleAdd}
                className="gradient-primary text-on-primary px-6 rounded-xl font-bold"
              >
                추가
              </button>
            </div>
          </div>
        )}

        {data.friends.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-outline">group</span>
            </div>
            <div className="text-on-surface-variant mb-2 font-semibold">{t('noFriends')}</div>
            <div className="text-outline text-sm">{t('addFriendHint')}</div>
          </div>
        ) : (
          <div className="space-y-3">
            {data.friends.map(friend => (
              <div key={friend.id} className="bg-surface-container-lowest rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-on-secondary-container">{friend.name[0]}</span>
                  </div>
                  <span className="font-bold text-primary">{friend.name}</span>
                </div>
                <button
                  onClick={() => removeFriend(friend.id)}
                  className="p-2 text-error"
                >
                  <span className="material-symbols-outlined">person_remove</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
