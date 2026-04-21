import { useState, useEffect } from 'react';
import { GolfProvider, useGolf } from './hooks/useGolf';
import { AppSettingsProvider, useAppSettings } from './hooks/useAppSettings';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Home from './pages/Home';
import PlayGame from './pages/PlayGame';
import Friends from './pages/Friends';
import Competitions from './pages/Competitions';
import Stats from './pages/Stats';
import History from './pages/History';
import Settings from './pages/Settings';
import { fetchMyInvitations, respondToInvitation, type CompetitionInvitation } from './utils/supabaseCompetition';
import { supabase } from './supabase';

type Page = 'home' | 'play' | 'friends' | 'competitions' | 'stats' | 'history' | 'settings';

interface NavigationBarProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
}

function LoginWarning() {
  const { user, loading } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (user || loading || dismissed) return null;

  return (
    <div className="fixed inset-0 bg-surface/80 backdrop-blur-sm z-40 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-xl border border-stone-200">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-4xl text-amber-600">info</span>
        </div>
        <h2 className="text-xl font-bold text-primary mb-2">테스트 모드</h2>
        <p className="text-stone-500 text-sm mb-4">
          로그인하면 데이터가 저장되고 친구와 대회를 공유할 수 있습니다.
        </p>
        <AuthButton />
        <button
          onClick={() => setDismissed(true)}
          className="w-full bg-stone-100 text-stone-600 py-3 rounded-xl font-bold active:scale-98 transition-transform"
        >
          테스트 계속하기
        </button>
      </div>
    </div>
  );
}

function AuthButton() {
  const { signInWithGoogle } = useAuth();
  return (
    <button
      onClick={signInWithGoogle}
      className="w-full bg-primary text-white py-3 rounded-xl font-bold active:scale-98 transition-transform mb-2"
    >
      로그인하기
    </button>
  );
}

function GlobalHeader() {
  const { data } = useGolf();
  const { t } = useAppSettings();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [invitations, setInvitations] = useState<CompetitionInvitation[]>([]);
  
  useEffect(() => {
    if (user) {
      fetchMyInvitations(user.id).then(setInvitations);
    }
  }, [user, showNotifications]);
  
  const hasNotifications = invitations.length > 0 || data.competitions.filter(c => c.status === 'active').length > 0;

  const handleAccept = async (inv: CompetitionInvitation) => {
    await respondToInvitation(inv.id, 'accepted');
    const comp = data.competitions.find(c => c.id === inv.competition_id);
    if (!comp) {
      alert(`"${inv.competition_name}" 대회에 참가했습니다!`);
    }
    setInvitations(prev => prev.filter(i => i.id !== inv.id));
  };

  const handleReject = async (inv: CompetitionInvitation) => {
    await respondToInvitation(inv.id, 'rejected');
    setInvitations(prev => prev.filter(i => i.id !== inv.id));
  };

  return (
    <>
      <header className="bg-white flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <div className="w-10"></div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary font-headline">
          GreenScore
        </h1>
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="text-stone-500 p-2 rounded-full active:scale-95 transition-transform relative"
        >
          <span className="material-symbols-outlined">notifications</span>
          {hasNotifications && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
      </header>

      {showNotifications && (
        <div className="fixed top-16 right-4 w-80 bg-white rounded-2xl shadow-xl z-50 p-4 max-h-96 overflow-y-auto">
          <h3 className="font-bold text-primary mb-3">🔔 {t('notifications')}</h3>
          
          {invitations.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-stone-500 font-bold mb-2 uppercase tracking-wider">대회 초대</p>
              <div className="space-y-2">
                {invitations.map(inv => (
                  <div key={inv.id} className="bg-surface-container rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-secondary-container rounded-full flex items-center justify-center text-xs font-bold text-secondary">
                        {inv.from_user_name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-primary">{inv.from_user_name}</p>
                        <p className="text-xs text-stone-500">"{inv.competition_name}" 대회 초대</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(inv)}
                        className="flex-1 bg-secondary text-white py-2 rounded-lg text-sm font-bold active:scale-98 transition-transform"
                      >
                        수락
                      </button>
                      <button
                        onClick={() => handleReject(inv)}
                        className="flex-1 bg-surface-container text-stone-600 py-2 rounded-lg text-sm font-bold active:scale-98 transition-transform"
                      >
                        거절
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {invitations.length === 0 && (
            <p className="text-stone-500 text-sm">{t('addFriendHint')}</p>
          )}
        </div>
      )}
    </>
  );
}

function NavigationBar({ onNavigate, currentPage }: NavigationBarProps) {
  const { data } = useGolf();
  
  const navigate = (newPage: Page) => onNavigate(newPage);
  const isActive = (p: Page) => currentPage === p;

  return (
    <>
      {currentPage !== 'play' && <GlobalHeader />}

      {currentPage !== 'play' && (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/70 backdrop-blur-md shadow-[0_-4px_24px_rgba(25,28,29,0.06)] rounded-t-[1.5rem]">
          <button
            onClick={() => navigate('home')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 ${
              isActive('home') ? 'bg-lime-400/20 text-primary rounded-2xl' : 'text-stone-500'
            }`}
          >
            <span className="material-symbols-outlined" style={isActive('home') ? {fontVariationSettings: "'FILL' 1"} : {}}>
              dashboard
            </span>
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1 text-stone-600">Home</span>
          </button>
          <button
            onClick={() => navigate('history')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 ${
              isActive('history') ? 'bg-lime-400/20 text-primary rounded-2xl' : 'text-stone-500'
            }`}
          >
            <span className="material-symbols-outlined" style={isActive('history') ? {fontVariationSettings: "'FILL' 1"} : {}}>
              history
            </span>
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1 text-stone-600">기록</span>
          </button>
          <button
            onClick={() => navigate('competitions')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 relative ${
              isActive('competitions') ? 'bg-lime-400/20 text-primary rounded-2xl' : 'text-stone-500'
            }`}
          >
            <span className="material-symbols-outlined relative" style={isActive('competitions') ? {fontVariationSettings: "'FILL' 1"} : {}}>
              emoji_events
            </span>
            {data.competitions.filter(c => c.status === 'active').length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                {data.competitions.filter(c => c.status === 'active').length}
              </span>
            )}
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1 text-stone-600">대회</span>
          </button>
          <button
            onClick={() => navigate('stats')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 ${
              isActive('stats') ? 'bg-lime-400/20 text-primary rounded-2xl' : 'text-stone-500'
            }`}
          >
            <span className="material-symbols-outlined" style={isActive('stats') ? {fontVariationSettings: "'FILL' 1"} : {}}>
              insights
            </span>
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1 text-stone-600">Stats</span>
          </button>
          <button
            onClick={() => navigate('friends')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 relative ${
              isActive('friends') ? 'bg-lime-400/20 text-primary rounded-2xl' : 'text-stone-500'
            }`}
          >
            <span className="material-symbols-outlined relative" style={isActive('friends') ? {fontVariationSettings: "'FILL' 1"} : {}}>
              group
            </span>
            {data.friends.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                {data.friends.length}
              </span>
            )}
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1 text-stone-600">친구</span>
          </button>
          <button
            onClick={() => navigate('settings')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 ${
              isActive('settings') ? 'bg-lime-400/20 text-primary rounded-2xl' : 'text-stone-500'
            }`}
          >
            <span className="material-symbols-outlined" style={isActive('settings') ? {fontVariationSettings: "'FILL' 1"} : {}}>
              settings
            </span>
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1 text-stone-600">설정</span>
          </button>
        </nav>
      )}
    </>
  );
}

function AppContent() {
  const [page, setPage] = useState<Page>('home');
  const [competitionId, setCompetitionId] = useState<string | undefined>();
  const [showFriendInviteDialog, setShowFriendInviteDialog] = useState<{name: string; id: string} | null>(null);
  const { user } = useAuth();
  const { data } = useGolf();

  const navigate = (newPage: Page) => setPage(newPage);

  const handleStartCompetitionGame = (compId: string) => {
    setCompetitionId(compId);
    setPage('play');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteId = params.get('invite');
    const inviterName = params.get('name');
    const inviterId = params.get('id');
    
    console.log('[App] URL params check:', { inviteId, inviterName, inviterId, userId: user?.id });
    
    if (inviteId && inviterName && inviterId && user && data.player?.name) {
      console.log('[App] Processing invite link for user:', user.id);
      const alreadyFriends = data.friends?.some(f => f.userId === inviterId) || false;
      
      if (!alreadyFriends) {
        console.log('[App] Showing friend invite dialog for', inviterName);
        setShowFriendInviteDialog({ name: inviterName, id: inviterId });
      }
    }
  }, [user, data.friends, data.player?.name]);

  const handleFriendInviteConfirm = async () => {
    if (!showFriendInviteDialog || !user || !data.player?.name) return;
    
    const { name: inviterName, id: inviterId } = showFriendInviteDialog;
    
    console.log('[App] Sending friend request from', user.id, 'to', inviterId);
    const { error } = await supabase
      .from('friend_requests')
      .insert({
        from_user_id: user.id,
        from_user_name: data.player.name,
        to_user_id: inviterId,
        to_user_name: inviterName,
        status: 'pending'
      });
      
    if (error) {
      console.error('[App] Error sending friend request:', error);
      alert('친구 요청 전송에 실패했습니다.');
    } else {
      console.log('[App] Friend request sent successfully');
      alert(`${inviterName}님에게 친구 요청을 보냈습니다.`);
    }
    
    setShowFriendInviteDialog(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleFriendInviteCancel = () => {
    setShowFriendInviteDialog(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  return (
    <>
      {showFriendInviteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold text-primary font-headline mb-4">친구 추가</h3>
            <p className="text-stone-600 mb-6">
              <strong>{showFriendInviteDialog.name}</strong>님이 친구 추가를 요청했습니다.
              <br />
              수락하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleFriendInviteCancel}
                className="flex-1 bg-stone-200 text-stone-700 py-3 rounded-xl font-bold active:scale-98 transition-transform"
              >
                거절
              </button>
              <button
                onClick={handleFriendInviteConfirm}
                className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold active:scale-98 transition-transform"
              >
                수락
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-surface">
        <LoginWarning />
      <NavigationBar 
        onNavigate={navigate} 
        currentPage={page} 
      />
      {page === 'home' && <Home onStartGame={() => navigate('play')} />}
      {page === 'play' && <PlayGame onBack={() => { setPage('home'); setCompetitionId(undefined); }} onComplete={() => navigate('history')} competitionId={competitionId} />}
      {page === 'friends' && <Friends onBack={() => navigate('home')} />}
      {page === 'competitions' && <Competitions onBack={() => navigate('home')} onStartCompetitionGame={handleStartCompetitionGame} />}
      {page === 'stats' && <Stats onBack={() => navigate('home')} />}
      {page === 'history' && <History onBack={() => navigate('home')} />}
      {page === 'settings' && <Settings onBack={() => navigate('home')} />}
        </div>
      </>
    );
  }

  function App() {
    console.log('[App] Component mounting');
    return (
      <AppSettingsProvider>
      <AuthProvider>
        <GolfProvider>
          <AppContent />
        </GolfProvider>
      </AuthProvider>
    </AppSettingsProvider>
  );
}

export default App;
