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
  const [inviteCode, setInviteCode] = useState('');
  const [showRedeem, setShowRedeem] = useState(false);
  const [showEmailInvite, setShowEmailInvite] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

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

  const handleEmailInvite = async () => {
    if (!emailInput.trim() || !user) return;
    
    const { data: existingUser } = await supabase
      .from('user_data')
      .select('user_id')
      .eq('email', emailInput.trim())
      .single();
    
    if (!existingUser) {
      alert('해당 이메일로 가입한 사용자가 없습니다.\n초대 링크를 보내주세요.');
      return;
    }
    
    const { data: userMeta } = await supabase.auth.getUser(existingUser.user_id);
    const friendName = userMeta.user?.user_metadata?.full_name || '친구';
    
    const exists = data.friends.some(f => f.userId === existingUser.user_id);
    if (exists) {
      alert('이미 추가된 친구입니다.');
    } else {
      addFriend(friendName, existingUser.user_id);
      alert(`${friendName}님을 친구로 추가했습니다!`);
    }
    
    setEmailInput('');
    setShowEmailInvite(false);
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


  const handleRedeem = async () => {
    if (!inviteCode.trim()) return;
    const code = inviteCode.trim().toUpperCase();
    
    const { data: invite, error } = await supabase
      .from('friend_invites')
      .select('*')
      .eq('code', code)
      .single();
    
    if (error || !invite) {
      alert('유효하지 않은 초대 코드입니다.');
      return;
    }
    
    if (invite.inviter_id === user?.id) {
      alert('자신의 코드는 사용할 수 없습니다.');
      return;
    }
    
    const exists = data.friends.some(f => f.userId === invite.inviter_id);
    if (exists) {
      alert('이미 추가된 친구입니다.');
    } else {
      addFriend(invite.inviter_name, invite.inviter_id);
      alert(`${invite.inviter_name}님을 친구로 추가했습니다!`);
      
      await supabase.from('friend_invites').delete().eq('code', code);
    }
    
    setInviteCode('');
    setShowRedeem(false);
  };

  return (
    <div className="min-h-screen bg-surface pb-32">
      <header className="bg-white dark:bg-surface-container-lowest flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <button onClick={onBack} className="p-2 -ml-2">
          <span className="material-symbols-outlined text-stone-500">arrow_back</span>
        </button>
        <h1 className="text-xl font-extrabold text-primary font-headline">{t('friends')}</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-6 pt-6 max-w-5xl mx-auto">
        <button
          onClick={generateInviteLink}
          className="w-full bg-secondary text-white py-4 rounded-2xl font-headline font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-lg mb-3"
        >
          <span className="material-symbols-outlined">link</span>
          {inviteLinkCopied ? '링크 복사됨!' : '초대 링크 만들기'}
        </button>

        <button
          onClick={() => setShowEmailInvite(!showEmailInvite)}
          className="w-full bg-tertiary text-white py-3 rounded-2xl font-headline font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-lg mb-3"
        >
          <span className="material-symbols-outlined">mail</span>
          {showEmailInvite ? '취소' : '이메일로 초대'}
        </button>

        {showEmailInvite && (
          <div className="bg-surface-container-lowest rounded-2xl p-6 mb-3">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="친구의 이메일 입력"
              className="w-full bg-surface-container border-none rounded-xl px-4 py-4 outline-none mb-4 text-lg text-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleEmailInvite()}
            />
            <button
              onClick={handleEmailInvite}
              disabled={!emailInput.trim()}
              className="w-full bg-tertiary text-white py-4 rounded-xl font-bold disabled:opacity-50 active:scale-98 transition-transform"
            >
              친구 추가
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowRedeem(!showRedeem)}
            className="flex-1 bg-stone-400 text-white py-3 rounded-2xl font-headline font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-lg dark:bg-outline dark:text-on-surface"
          >
            <span className="material-symbols-outlined">vpn_key</span>
            {showRedeem ? '취소' : '초대 코드 입력'}
          </button>
        </div>

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
              className="w-full bg-stone-400 text-white py-4 rounded-xl font-bold disabled:opacity-50 active:scale-98 transition-transform dark:bg-outline dark:text-on-surface"
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