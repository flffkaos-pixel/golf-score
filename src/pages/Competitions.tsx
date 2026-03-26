import { useState } from 'react';
import { useGolf } from '../hooks/useGolf';
import { useAppSettings } from '../hooks/useAppSettings';
import { getScoreDisplay } from '../utils/storage';

interface CompetitionsProps {
  onBack: () => void;
}

export default function Competitions({ onBack }: CompetitionsProps) {
  const { data, createCompetition, joinCompetition, deleteCompetition } = useGolf();
  const { t } = useAppSettings();
  const [showCreate, setShowCreate] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const handleCreate = () => {
    if (!newCompName.trim()) return;
    createCompetition(newCompName.trim(), selectedFriends);
    setNewCompName('');
    setShowCreate(false);
    setSelectedFriends([]);
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-secondary text-white';
      case 'finished': return 'bg-stone-400 text-white';
      default: return 'bg-tertiary-fixed text-tertiary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return t('active');
      case 'finished': return t('finished');
      default: return t('pending');
    }
  };

  const activeComps = data.competitions.filter(c => c.status !== 'finished');

  return (
    <div className="min-h-screen bg-surface pb-32">
      <header className="bg-white flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <button onClick={onBack} className="p-2 -ml-2">
          <span className="material-symbols-outlined text-stone-500">arrow_back</span>
        </button>
        <h1 className="text-xl font-extrabold text-primary font-headline">{t('competitions')}</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="text-secondary font-bold">
          {showCreate ? t('cancel') : '+ 만들기'}
        </button>
      </header>

      <main className="px-6 pt-6 max-w-5xl mx-auto">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="w-full bg-gradient-to-r from-secondary to-tertiary text-white py-5 rounded-2xl font-headline font-bold text-lg flex items-center justify-center gap-3 active:scale-98 transition-transform shadow-lg"
        >
          <span className="material-symbols-outlined">add_circle</span>
          {t('createComp')}
        </button>

        {showCreate && (
          <div className="bg-surface-container-lowest rounded-2xl p-6 mt-4">
            <input
              type="text"
              value={newCompName}
              onChange={(e) => setNewCompName(e.target.value)}
              placeholder={t('compNamePlaceholder')}
              className="w-full bg-surface-container border-none rounded-xl px-4 py-4 outline-none mb-4 text-lg text-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            
            {data.friends.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-stone-500 font-bold mb-2">친구 초대</p>
                <div className="flex flex-wrap gap-2">
                  {data.friends.map(friend => (
                    <button
                      key={friend.id}
                      onClick={() => toggleFriend(friend.id)}
                      className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                        selectedFriends.includes(friend.id)
                          ? 'bg-secondary text-white'
                          : 'bg-surface-container text-stone-600'
                      }`}
                    >
                      {friend.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreate(false);
                  setSelectedFriends([]);
                }}
                className="flex-1 bg-surface-container text-stone-600 py-4 rounded-xl font-bold active:scale-98 transition-transform"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={!newCompName.trim()}
                className="flex-1 bg-primary text-white py-4 rounded-xl font-bold disabled:opacity-50 active:scale-98 transition-transform"
              >
                {t('create')}
              </button>
            </div>
          </div>
        )}

        <section className="mt-8">
          <h2 className="font-headline font-bold text-lg mb-4">{t('activeCompetitions')}</h2>

          {activeComps.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-outline">emoji_events</span>
              </div>
              <div className="text-stone-500 mb-2 font-semibold">{t('noCompetitions')}</div>
              <div className="text-stone-400 text-sm">{t('competitionsDesc')}</div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeComps.map(comp => (
                <div key={comp.id} className="bg-surface-container-lowest rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-primary font-headline">{comp.name}</h3>
                      <p className="text-xs text-stone-500">{new Date(comp.startDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {comp.hostId === data.player.id && (
                        <button
                          onClick={() => {
                            if (confirm(t('deleteConfirm'))) {
                              deleteCompetition(comp.id);
                            }
                          }}
                          className="p-2 text-error hover:bg-error-container rounded-full transition-colors"
                          title={t('delete')}
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      )}
                      <span className={`${getStatusColor(comp.status)} text-xs px-3 py-1 rounded-full font-bold`}>
                        {getStatusText(comp.status)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm text-stone-500 font-bold">{t('participants')}</span>
                    <div className="flex -space-x-2">
                      {comp.players.slice(0, 5).map((player) => (
                        <div
                          key={player.id}
                          className="w-8 h-8 bg-secondary-container rounded-full flex items-center justify-center text-xs font-bold text-secondary border-2 border-surface-container-lowest"
                        >
                          {player.name[0].toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-stone-500">{comp.players.length}명</span>
                  </div>

                  {comp.rounds.length > 0 && (
                    <div className="bg-surface-container rounded-xl p-4 mb-4">
                      <p className="text-xs text-stone-500 font-bold mb-2">{t('ranking')}</p>
                      {comp.rounds
                        .sort((a, b) => a.relativeScore - b.relativeScore)
                        .slice(0, 3)
                        .map((round, i) => {
                          const player = comp.players.find(p => p.id === round.id) || { name: 'Unknown' };
                          const scoreDisplay = getScoreDisplay(round.relativeScore);
                          return (
                            <div key={round.id} className="flex items-center justify-between text-sm mb-2 last:mb-0">
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  i === 0 ? 'bg-yellow-400 text-stone-900' : 
                                  i === 1 ? 'bg-stone-300 text-stone-700' : 
                                  i === 2 ? 'bg-amber-600 text-white' : 'bg-surface-container text-stone-600'
                                }`}>
                                  {i + 1}
                                </span>
                                <span className="text-primary font-semibold">{player.name}</span>
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
                      className="w-full bg-primary text-white py-3 rounded-xl font-bold active:scale-98 transition-transform"
                    >
                      {t('join')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
