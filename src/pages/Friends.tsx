import { useState, useEffect } from 'react';
import { useGolf } from '../hooks/useGolf';
import { useAppSettings } from '../hooks/useAppSettings';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';

interface FriendsProps {
  onBack: () => void;
}

export default function Friends({ onBack }: FriendsProps) {
  const { data, addFriend, removeFriend, updateFriend } = useGolf();
  const { t } = useAppSettings();
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Array<{id: string; from_user_id: string; from_user_name: string}>>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendUserId, setFriendUserId] = useState('');
  const [friendUserName, setFriendUserName] = useState('');

  // Load pending friend requests
  useEffect(() => {
    if (!user) return;
    
    const loadPendingRequests = async () => {
      const { data: requests } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('to_user_id', user.id)
        .eq('status', 'pending');
      
      if (requests) {
        setPendingRequests(requests);
      }
    };
    
    loadPendingRequests();

    // Realtime subscription for new friend requests
    const channel = supabase
      .channel('friend-requests-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'friend_requests', filter: `to_user_id=eq.${user.id}` },
        (payload) => {
          const req = payload.new as any;
          setPendingRequests(prev => {
            if (prev.some(r => r.id === req.id)) return prev;
            return [...prev, { id: req.id, from_user_id: req.from_user_id, from_user_name: req.from_user_name }];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteId = params.get('invite');
    const inviterName = params.get('name');
    const inviterId = params.get('id');
    
    if (inviteId && inviterName && inviterId && user) {
      const exists = data.friends.some(f => f.userId === inviterId);
      if (!exists) {
        addFriend(inviterName, inviterId);
        alert(`${inviterName}님을 친구로 추가했습니다!`);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [user, data.friends]);

  const generateInviteLink = async () => {
    if (!user) {
      alert('로그인 후 이용해주세요.');
      return;
    }
    
    const baseUrl = window.location.origin + window.location.pathname;
    const inviteLink = `${baseUrl}?invite=1&name=${encodeURIComponent(data.player.name)}&id=${encodeURIComponent(user.id)}`;
    
    await navigator.clipboard.writeText(inviteLink);
    setInviteLinkCopied(true);
    setTimeout(() => setInviteLinkCopied(false), 2000);
  };

  const handleSendFriendRequest = async () => {
    if (!friendUserId.trim() || !friendUserName.trim() || !user) {
      alert('사용자 ID와 이름을 모두 입력해주세요.');
      return;
    }

    if (friendUserId === user.id) {
      alert('자신에게는 친구 요청을 보낼 수 없습니다.');
      return;
    }

    const alreadyFriend = data.friends.some(f => f.userId === friendUserId);
    if (alreadyFriend) {
      alert('이미 친구로 추가되어 있습니다.');
      return;
    }

    // Check if already sent a pending request
    const { data: existing } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('from_user_id', user.id)
      .eq('to_user_id', friendUserId)
      .eq('status', 'pending');

    if (existing && existing.length > 0) {
      alert('이미 친구 요청을 보냈습니다.');
      return;
    }

    // Add friend locally (optimistic)
    addFriend(friendUserName.trim(), friendUserId.trim());

    // Send friend request to Supabase
    try {
      const { error } = await supabase.from('friend_requests').insert({
        from_user_id: user.id,
        from_user_name: data.player.name,
        to_user_id: friendUserId.trim(),
        status: 'pending',
      });
      if (error) {
        console.error('Friend request error:', error);
        alert('친구 요청 전송에 실패했습니다. 상대의 사용자 ID를 확인해주세요.');
      } else {
        alert(`${friendUserName.trim()}님에게 친구 요청을 보냈습니다!`);
      }
    } catch (e) {
      console.error('Friend request error:', e);
    }

    setFriendUserId('');
    setFriendUserName('');
    setShowAddFriend(false);
  };

  const acceptFriendRequest = async (requestId: string, fromUserId: string, fromUserName: string) => {
    addFriend(fromUserName, fromUserId);
    
    await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);
    
    await supabase
      .from('friendships')
      .upsert({
        user_id: fromUserId,
        friend_id: user?.id,
        friend_name: data.player.name,
      }, { onConflict: 'user_id,friend_id' });
    
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const declineFriendRequest = async (requestId: string) => {
    await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId);
    
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
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
        {/* Pending friend requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <h2 className="font-headline font-bold text-lg mb-3 text-amber-600">친구 요청</h2>
            <div className="space-y-3">
              {pendingRequests.map(request => (
                <div key={request.id} className="bg-amber-50 rounded-2xl p-4 flex items-center justify-between border border-amber-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 font-bold text-lg">
                      {request.from_user_name[0].toUpperCase()}
                    </div>
                    <span className="font-bold text-primary font-headline text-lg">{request.from_user_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptFriendRequest(request.id, request.from_user_id, request.from_user_name)}
                      className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold active:scale-95"
                    >
                      수락
                    </button>
                    <button
                      onClick={() => declineFriendRequest(request.id)}
                      className="bg-stone-200 text-stone-600 px-4 py-2 rounded-xl font-bold active:scale-95"
                    >
                      거절
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={generateInviteLink}
          className="w-full bg-secondary text-white py-4 rounded-2xl font-headline font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-lg mb-3"
        >
          <span className="material-symbols-outlined">link</span>
          {inviteLinkCopied ? '링크 복사됨!' : '초대 링크 만들기'}
        </button>

        <button
          onClick={() => setShowAddFriend(!showAddFriend)}
          className="w-full bg-tertiary text-white py-3 rounded-2xl font-headline font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-lg mb-3"
        >
          <span className="material-symbols-outlined">person_add</span>
          {showAddFriend ? '취소' : '친구 ID로 추가'}
        </button>

        {showAddFriend && (
          <div className="bg-surface-container-lowest rounded-2xl p-6 mb-3">
            <input
              type="text"
              value={friendUserId}
              onChange={(e) => setFriendUserId(e.target.value)}
              placeholder="친구의 Supabase 사용자 ID"
              className="w-full bg-surface-container border-none rounded-xl px-4 py-4 outline-none mb-3 text-sm text-primary"
            />
            <input
              type="text"
              value={friendUserName}
              onChange={(e) => setFriendUserName(e.target.value)}
              placeholder="친구 이름"
              className="w-full bg-surface-container border-none rounded-xl px-4 py-4 outline-none mb-4 text-lg text-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleSendFriendRequest()}
            />
            <button
              onClick={handleSendFriendRequest}
              disabled={!friendUserId.trim() || !friendUserName.trim()}
              className="w-full bg-tertiary text-white py-4 rounded-xl font-bold disabled:opacity-50 active:scale-98 transition-transform"
            >
              친구 요청 보내기
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
