import { useState } from 'react';
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
  const { data, pendingInvites, respondToCompetitionInvite } = useGolf();
  const { t } = useAppSettings();
  const [showNotifications, setShowNotifications] = useState(false);

  const dismissInvite = (inviteId: string) => {
    setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
  };
  
  const hasNotifications = data.competitions.filter(c => c.status === 'active').length > 0 || data.friends.length > 0 || pendingInvites.length > 0;

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
        <div className="fixed top-16 right-4 w-80 max-h-[80vh] overflow-y-auto bg-white rounded-2xl shadow-xl z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-primary">🔔 {t('notifications')}</h3>
            <button onClick={() => setShowNotifications(false)} className="text-stone-400 hover:text-stone-600">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          {pendingInvites.length === 0 && data.friends.length === 0 && data.competitions.filter(c => c.status === 'active').length === 0 ? (
            <p className="text-stone-500 text-sm">알림이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {pendingInvites.map(invite => (
                <div key={invite.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3 relative">
                  <button
                    onClick={() => dismissInvite(invite.id)}
                    className="absolute top-2 right-2 text-amber-400 hover:text-amber-600"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold text-amber-700">
                      {invite.fromUserName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-primary">{invite.fromUserName}</p>
                      <p className="text-xs text-stone-500">"{invite.competitionName}" 대회에 초대했습니다!</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondToCompetitionInvite(invite.id, true)}
                      className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold text-sm active:scale-95 transition-transform"
                    >
                      ✓ 수락
                    </button>
                    <button
                      onClick={() => respondToCompetitionInvite(invite.id, false)}
                      className="flex-1 bg-stone-200 text-stone-600 py-2 rounded-lg font-bold text-sm active:scale-95 transition-transform"
                    >
                      ✕ 거절
                    </button>
                  </div>
                </div>
              ))}
              
              {data.competitions.filter(c => c.status === 'active').slice(0, 3).map(comp => (
                <div key={comp.id} className="flex items-center gap-3 p-2 bg-surface-container rounded-xl">
                  <div className="w-8 h-8 bg-secondary-container rounded-full flex items-center justify-center text-xs font-bold text-on-secondary-container">
                    {comp.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary">{comp.name}</p>
                    <p className="text-xs text-stone-500">진행 중 - {comp.players.length}명 참가</p>
                  </div>
                </div>
              ))}
            </div>
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

  const navigate = (newPage: Page) => setPage(newPage);

  const handleStartCompetitionGame = (compId: string) => {
    setCompetitionId(compId);
    setPage('play');
  };

  return (
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
  );
}

function App() {
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