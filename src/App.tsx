import { useState } from 'react';
import { GolfProvider, useGolf } from './hooks/useGolf';
import { AppSettingsProvider, useAppSettings } from './hooks/useAppSettings';
import { AuthProvider } from './hooks/useAuth';
import Home from './pages/Home';
import PlayGame from './pages/PlayGame';
import Friends from './pages/Friends';
import Competitions from './pages/Competitions';
import Stats from './pages/Stats';
import History from './pages/History';
import Settings from './pages/Settings';

type Page = 'home' | 'play' | 'friends' | 'competitions' | 'stats' | 'history' | 'settings';

function GlobalHeader() {
  const { data } = useGolf();
  const { t } = useAppSettings();
  const [showNotifications, setShowNotifications] = useState(false);
  
  const hasNotifications = data.friends.length > 0;

  return (
    <>
      <header className="bg-surface-container-lowest flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <div className="w-10"></div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary font-headline">
          GreenScore
        </h1>
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="text-on-surface-variant p-2 rounded-full active:scale-95 transition-transform relative"
        >
          <span className="material-symbols-outlined">notifications</span>
          {hasNotifications && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full"></span>
          )}
        </button>
      </header>

      {showNotifications && (
        <div className="fixed top-16 right-4 w-72 bg-surface-container-lowest rounded-2xl shadow-xl z-50 p-4">
          <h3 className="font-bold text-primary mb-3">🔔 {t('notifications')}</h3>
          {data.friends.length === 0 ? (
            <p className="text-on-surface-variant text-sm">{t('addFriendHint')}</p>
          ) : (
            <div className="space-y-2">
              {data.friends.slice(0, 3).map(friend => (
                <div key={friend.id} className="flex items-center gap-3 p-2 bg-surface-container rounded-xl">
                  <div className="w-8 h-8 bg-secondary-container rounded-full flex items-center justify-center text-xs font-bold text-on-secondary-container">
                    {friend.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-on-surface">{friend.name}</p>
                    <p className="text-xs text-on-surface-variant">{t('startRound')}...</p>
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

function NavigationBar() {
  const [page, setPage] = useState<Page>('home');
  const { data } = useGolf();
  
  const navigate = (newPage: Page) => setPage(newPage);
  const isActive = (p: Page) => page === p;
  
  const hasCompNotifications = data.competitions.filter(c => c.status === 'active').length > 0;

  return (
    <>
      {page !== 'play' && <GlobalHeader />}

      {page === 'home' && <Home onStartGame={() => navigate('play')} />}
      {page === 'play' && <PlayGame onBack={() => navigate('home')} onComplete={() => navigate('history')} />}
      {page === 'friends' && <Friends onBack={() => navigate('home')} />}
      {page === 'competitions' && <Competitions onBack={() => navigate('home')} />}
      {page === 'stats' && <Stats onBack={() => navigate('home')} />}
      {page === 'history' && <History onBack={() => navigate('home')} />}
      {page === 'settings' && <Settings onBack={() => navigate('home')} />}

      {page !== 'play' && (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 glass rounded-t-[1.5rem]">
          <button
            onClick={() => navigate('home')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 rounded-2xl ${
              isActive('home') ? 'bg-tertiary-fixed/20 text-primary dark:text-on-surface' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined" style={isActive('home') ? {fontVariationSettings: "'FILL' 1"} : {}}>
              dashboard
            </span>
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1">Home</span>
          </button>
          <button
            onClick={() => navigate('history')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 rounded-2xl ${
              isActive('history') ? 'bg-tertiary-fixed/20 text-primary dark:text-on-surface' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined" style={isActive('history') ? {fontVariationSettings: "'FILL' 1"} : {}}>
              history
            </span>
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1">기록</span>
          </button>
          <button
            onClick={() => navigate('competitions')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 rounded-2xl relative ${
              isActive('competitions') ? 'bg-tertiary-fixed/20 text-primary dark:text-on-surface' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined relative" style={isActive('competitions') ? {fontVariationSettings: "'FILL' 1"} : {}}>
              emoji_events
            </span>
            {hasCompNotifications && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center text-[10px] text-on-secondary font-bold">
                {data.competitions.filter(c => c.status === 'active').length}
              </span>
            )}
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1">대회</span>
          </button>
          <button
            onClick={() => navigate('stats')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 rounded-2xl ${
              isActive('stats') ? 'bg-tertiary-fixed/20 text-primary dark:text-on-surface' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined" style={isActive('stats') ? {fontVariationSettings: "'FILL' 1"} : {}}>
              insights
            </span>
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1">Stats</span>
          </button>
          <button
            onClick={() => navigate('settings')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 rounded-2xl ${
              isActive('settings') ? 'bg-tertiary-fixed/20 text-primary dark:text-on-surface' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined" style={isActive('settings') ? {fontVariationSettings: "'FILL' 1"} : {}}>
              settings
            </span>
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1">설정</span>
          </button>
        </nav>
      )}
    </>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-surface">
      <NavigationBar />
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
