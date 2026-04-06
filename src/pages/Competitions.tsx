import { useState, useEffect } from 'react';
import { useGolf } from '../hooks/useGolf';
import { useAppSettings } from '../hooks/useAppSettings';
import { useAuth } from '../hooks/useAuth';
import { getScoreDisplay } from '../utils/storage';

function isHost(comp: any, user: any, playerId: string): boolean {
  const uid = user?.id || playerId;
  return comp.hostId === uid;
}

interface CompetitionsProps {
  onBack: () => void;
  onStartCompetitionGame: (compId: string) => void;
}

export default function Competitions({ onBack, onStartCompetitionGame }: CompetitionsProps) {
  const { data, createCompetition, joinCompetition, deleteCompetition, sendCompetitionInvite, pendingInvites } = useGolf();
  const { t } = useAppSettings();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [shareLinkCompId, setShareLinkCompId] = useState<string | null>(null);
  const [inviteCompId, setInviteCompId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const compId = params.get('comp');
    const hostId = params.get('host');
    const compName = params.get('name');
    
    if (compId && hostId && compName) {
      const exists = data.competitions.some(c => c.id === compId);
      if (!exists) {
        joinCompetition(compId, hostId as string, decodeURIComponent(compName));
        alert(`"${decodeURIComponent(compName)}" 대회에 참여했습니다!`);
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user, data.competitions]);

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    window.location.reload();
  };

  const handleShareComp = async (compId: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const comp = data.competitions.find(c => c.id === compId);
    if (!comp) return;
    
    const shareLink = `${baseUrl}?comp=${encodeURIComponent(compId)}&host=${encodeURIComponent(comp.hostId)}&name=${encodeURIComponent(comp.name)}`;
    await navigator.clipboard.writeText(shareLink);
    setShareLinkCompId(compId);
    setTimeout(() => {
      setShareLinkCompId(null);
    }, 2000);
  };

  const handleCreate = async () => {
    if (!newCompName.trim()) return;
    await createCompetition(newCompName.trim(), selectedFriends);
    setNewCompName('');
    setShowCreate(false);
    setSelectedFriends([]);
  };

  const toggleFriend = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(prev => prev.filter(id => id !== friendId));
    } else if (selectedFriends.length < 4) {
      setSelectedFriends(prev => [...prev, friendId]);
    }
  };

  const getFriendInviteStatus = (friendId: string) => {
    const friend = data.friends.find(f => f.id === friendId);
    if (!friend) return 'none';
    const friendUid = friend.userId || friendId;
    if (data.competitions.some(c => c.playerIds.includes(friendUid))) return 'joined';
    return 'none';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-secondary text-white';
      case 'finished': return 'bg-stone-400 text-white';
      default: return 'bg-tertiary-fixed text-on-tertiary-fixed';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return t('active');
      case 'finished': return t('finished');
      default: return t('pending');
    }
  };

  const handleInviteFriend = (compId: string) => {
    setInviteCompId(compId);
  };

  const confirmInviteFriend = async (friendId: string) => {
    if (!inviteCompId) return;
    const comp = data.competitions.find(c => c.id === inviteCompId);
    const friend = data.friends.find(f => f.id === friendId);
    if (!comp || !friend) return;
    
    await sendCompetitionInvite(inviteCompId, comp.name, friendId, friend.name);
    setInviteCompId(null);
  };

  const activeComps = data.competitions.filter(c => c.status !== 'finished');

  return (
    <div className="min-h-screen bg-surface pb-32">
      <header className="bg-white flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <button onClick={onBack} className="p-2 -ml-2">
          <span className="material-symbols-outlined text-stone-500">arrow_back</span>
        </button>
        <h1 className="text-xl font-extrabold text-primary font-headline">{t('competitions')}</h1>
        <button onClick={handleRefresh} className="p-2 text-secondary" title="새로고침">
          <span className="material-symbols-outlined">refresh</span>
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
                <p className="text-sm text-stone-500 font-bold mb-2">
                  친구 초대 ({selectedFriends.length}/4)
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.friends.map(friend => {
                    const status = getFriendInviteStatus(friend.id);
                    return (
                    <button
                      key={friend.id}
                      onClick={() => toggleFriend(friend.id)}
                      disabled={!selectedFriends.includes(friend.id) && (selectedFriends.length >= 4 || status === 'joined')}
                      className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                        selectedFriends.includes(friend.id)
                          ? 'bg-secondary text-white'
                          : status === 'joined'
                          ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          : !selectedFriends.includes(friend.id) && selectedFriends.length >= 4
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            : 'bg-surface-container text-stone-600'
                      }`}
                    >
                      {friend.name}
                      {status === 'joined' && <span className="ml-1 text-xs">(참여중)</span>}
                    </button>
                    );
                  })}
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
                      <button
                        onClick={() => handleInviteFriend(comp.id)}
                        className="p-2 rounded-full transition-colors bg-surface-container text-stone-600 hover:bg-secondary-container"
                        title="친구 초대"
                      >
                        <span className="material-symbols-outlined text-lg">person_add</span>
                      </button>
                      <button
                        onClick={() => handleShareComp(comp.id)}
                        className={`p-2 rounded-full transition-colors ${
                          shareLinkCompId === comp.id 
                            ? 'bg-secondary text-white' 
                            : 'bg-surface-container text-stone-600 hover:bg-secondary-container'
                        }`}
                        title="대회 공유"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {shareLinkCompId === comp.id ? 'check' : 'share'}
                        </span>
                      </button>
                      {isHost(comp, user, data.player.id) && (
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
                        .map((round, i) => {
                          const player = comp.players.find(p => p.id === round.playerId) || { name: 'Unknown' };
                          const scoreDisplay = getScoreDisplay(round.relativeScore);
                          const isCurrentUser = round.playerId === data.player.id;
                          return (
                            <div key={round.id} className={`flex items-center justify-between text-sm mb-2 last:mb-0 rounded-lg px-2 py-1 ${isCurrentUser ? 'bg-secondary/10' : ''}`}>
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  i === 0 ? 'bg-yellow-400 text-stone-900' : 
                                  i === 1 ? 'bg-stone-300 text-stone-700' : 
                                  i === 2 ? 'bg-amber-600 text-white' : 'bg-surface-container text-stone-600'
                                }`}>
                                  {i + 1}
                                </span>
                                <span className="text-primary font-semibold">
                                  {player.name}
                                  {isCurrentUser && <span className="ml-1 text-secondary">(나)</span>}
                                </span>
                              </div>
                              <span className={`font-bold ${scoreDisplay.color}`}>
                                {round.totalScore} ({scoreDisplay.text})
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  <button
                    onClick={() => onStartCompetitionGame(comp.id)}
                    className="w-full bg-secondary text-white py-4 rounded-2xl font-bold text-lg active:scale-98 transition-transform shadow-lg"
                  >
                    참가하기
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {inviteCompId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-primary font-headline mb-4">친구 초대</h3>
            {data.friends.length === 0 ? (
              <p className="text-stone-500 mb-4">초대할 친구가 없습니다.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.friends.map(friend => {
                  const comp = data.competitions.find(c => c.id === inviteCompId);
                  const alreadyJoined = comp?.players.some(p => p.id === friend.id);
                  const alreadyInvited = pendingInvites.some(i => i.competitionId === inviteCompId && i.toUserId === (friend.userId || friend.id));
                  return (
                    <button
                      key={friend.id}
                      onClick={() => !alreadyJoined && !alreadyInvited && confirmInviteFriend(friend.id)}
                      disabled={alreadyJoined || alreadyInvited}
                      className={`w-full p-3 rounded-xl text-left font-bold transition-all ${
                        alreadyJoined
                          ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                          : alreadyInvited
                          ? 'bg-amber-50 text-amber-600 cursor-not-allowed'
                          : 'bg-surface-container text-primary active:scale-98 hover:bg-secondary-container'
                      }`}
                    >
                      {friend.name}
                      {alreadyJoined && <span className="ml-2 text-xs">(이미 참여)</span>}
                      {alreadyInvited && !alreadyJoined && <span className="ml-2 text-xs">(초대 발송됨)</span>}
                    </button>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => setInviteCompId(null)}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold mt-4"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
