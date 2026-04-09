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

   // Load pending friend requests
   useEffect(() => {
     if (!user) return;
     
     const loadPendingRequests = async () => {
       console.log('[Friends] Loading pending friend requests for user:', user.id);
       const { data: requests, error } = await supabase
         .from('friend_requests')
         .select('*')
         .eq('to_user_id', user.id)
         .eq('status', 'pending');
       
       if (error) {
         console.error('[Friends] Error loading pending requests:', error);
       } else if (requests) {
         console.log('[Friends] Loaded pending requests:', requests);
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
           console.log('[Friends] Received new friend request:', req);
           setPendingRequests(prev => {
             if (prev.some(r => r.id === req.id)) return prev;
             return [...prev, { id: req.id, from_user_id: req.from_user_id, from_user_name: req.from_user_name }];
           });
         }
       )
       .on(
         'postgres_changes',
         { event: 'UPDATE', schema: 'public', table: 'friend_requests' },
         (payload) => {
           const req = payload.new as any;
           console.log('[Friends] Friend request updated:', req);
           if (req.status === 'accepted' || req.status === 'rejected') {
             setPendingRequests(prev => prev.filter(r => r.id !== req.id));
           }
         }
       )
       .on(
         'postgres_changes',
         { event: 'DELETE', schema: 'public', table: 'friend_requests' },
         (payload) => {
           const req = payload.old as any;
           console.log('[Friends] Friend request deleted:', req);
           setPendingRequests(prev => prev.filter(r => r.id !== req.id));
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
     
     console.log('[Friends] URL params check:', { inviteId, inviterName, inviterId, userId: user?.id });
     
     if (inviteId && inviterName && inviterId && user) {
       console.log('[Friends] Processing invite link for user:', user.id);
       // When someone visits an invite link, send them a friend request
       // Don't auto-add as friend - let them decide via the request system
       const alreadyFriends = data.friends.some(f => f.userId === inviterId);
       const alreadyRequested = pendingRequests.some(r => 
         (r.from_user_id === user.id && r.to_user_id === inviterId) ||  // We sent to them
         (r.from_user_id === inviterId && r.to_user_id === user.id)   // They sent to us
       );
       
       console.log('[Friends] Relationship check:', {
         alreadyFriends,
         alreadyRequested,
         friendsCount: data.friends.length,
         pendingCount: pendingRequests.length
       });
       
       if (!alreadyFriends && !alreadyRequested) {
         // Send friend request to the person who sent the invite
         console.log('[Friends] Sending friend request from', user.id, 'to', inviterId);
         supabase
           .from('friend_requests')
           .insert({
             from_user_id: user.id,
             from_user_name: data.player.name,
             to_user_id: inviterId,
             to_user_name: inviterName,
             status: 'pending'
           })
           .then(() => {
             console.log('[Friends] Friend request sent successfully');
             alert(`${inviterName}님에게 친구 요청을 보냈습니다.`);
             window.history.replaceState({}, '', window.location.pathname);
           })
           .catch(error => {
             console.error('[Friends] Error sending friend request:', error);
             alert('친구 요청 전송에 실패했습니다.');
           });
       } else if (alreadyFriends) {
         // Already friends
         console.log('[Friends] Already friends with', inviterId);
         alert(`${inviterName}님은 이미 당신의 친구입니다.`);
         window.history.replaceState({}, '', window.location.pathname);
       } else {
         // Request already sent (either direction)
         console.log('[Friends] Request already exists in either direction');
         alert('이미 친구 요청이 보내졌거나 받은 상태입니다.');
         window.history.replaceState({}, '', window.location.pathname);
       }
     } else {
       console.log('[Friends] Invite link params missing:', { 
         hasInviteId: !!inviteId, 
         hasInviterName: !!inviterName, 
         hasInviterId: !!inviterId, 
         hasUser: !!user 
       });
     }
   }, [user, data.friends, pendingRequests]);

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

   const acceptFriendRequest = async (requestId: string, fromUserId: string, fromUserName: string) => {
     // Add friend locally (this user sees the requester as friend)
     addFriend(fromUserName, fromUserId);
     
     await supabase
       .from('friend_requests')
       .update({ status: 'accepted' })
       .eq('id', requestId);
     
     // Create bidirectional friendship records
     // 1. Requester sees current user as their friend
     await supabase
       .from('friendships')
       .upsert({
         user_id: fromUserId,
         friend_id: user?.id,
         friend_name: data.player.name,
       }, { onConflict: 'user_id,friend_id' });
       
     // 2. Current user sees requester as their friend
     await supabase
       .from('friendships')
       .upsert({
         user_id: user?.id,
         friend_id: fromUserId,
         friend_name: fromUserName,
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
