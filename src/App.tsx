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
      <header className="bg-white dark:bg-stone-950 flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <div className="w-10"></div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary font-headline">
          GreenScore
        </h1>
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="text-stone-500 dark:text-stone-400 p-2 rounded-full active:scale-95 transition-transform relative"
        >
          <span className="material-symbols-outlined">notifications</span>
          {hasNotifications && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
      </header>

      {showNotifications && (
        <div className="fixed top-16 right-4 w-72 bg-white dark:bg-stone-900 rounded-2xl shadow-xl z-50 p-4">
          <h3 className="font-bold text-primary dark:text-white mb-3">🔔 {t('notifications')}</h3>
          {data.friends.length === 0 ? (
            <p className="text-stone-500 dark:text-stone-400 text-sm">{t('addFriendHint')}</p>
          ) : (
            <div className="space-y-2">
              {data.friends.slice(0, 3).map(friend => (
                <div key={friend.id} className="flex items-center gap-3 p-2 bg-surface-container dark:bg-stone-800 rounded-xl">
                  <div className="w-8 h-8 bg-secondary-container dark:bg-secondary rounded-full flex items-center justify-center text-xs font-bold text-on-secondary-container">
                    {friend.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary dark:text-white">{friend.name}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{t('startRound')}...</p>
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
  
  const hasNotifications = data.competitions.filter(c => c.status === 'active').length > 0 || data.friends.length > 0;

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
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/70 dark:bg-stone-950/70 backdrop-blur-md shadow-[0_-4px_24px_rgba(25,28,29,0.06)] rounded-t-[1.5rem]">
          <button
            onClick={() => navigate('home')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 ${
              isActive('home') ? 'bg-lime-400/20 text-primary dark:bg-lime-900/30 dark:text-lime-300 rounded-2xl' : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <span className="material-symbols-outlined" style={isActive('home') ? {fontVariationSettings: "'FILL' 1"} : {}}>
              dashboard
            </span>
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1 text-stone-600 dark:text-stone-300">Home</span>
          </button>
          <button
            onClick={() => navigate('history')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 ${
              isActive('history') ? 'bg-lime-400/20 text-primary dark:bg-lime-900/30 dark:text-lime-300 rounded-2xl' : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <span className="material-symbols-outlined" style={isActive('history') ? {fontVariationSettings: "'FILL' 1"} : {}}>
              history
            </span>
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1 text-stone-600 dark:text-stone-300">기록</span>
          </button>
          <button
            onClick={() => navigate('competitions')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 relative ${
              isActive('competitions') ? 'bg-lime-400/20 text-primary dark:bg-lime-900/30 dark:text-lime-300 rounded-2xl' : 'text-stone-500 dark:text-stone-400'
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
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1 text-stone-600 dark:text-stone-300">대회</span>
          </button>
          <button
            onClick={() => navigate('stats')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 ${
              isActive('stats') ? 'bg-lime-400/20 text-primary dark:bg-lime-900/30 dark:text-lime-300 rounded-2xl' : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <span className="material-symbols-outlined" style={isActive('stats') ? {fontVariationSettings: "'FILL' 1"} : {}}>
              insights
            </span>
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1 text-stone-600 dark:text-stone-300">Stats</span>
          </button>
          <button
            onClick={() => navigate('settings')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 ${
              isActive('settings') ? 'bg-lime-400/20 text-primary dark:bg-lime-900/30 dark:text-lime-300 rounded-2xl' : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <span className="material-symbols-outlined relative" style={isActive('settings') ? {fontVariationSettings: "'FILL' 1"} : {}}>
              settings
            </span>
            {hasNotifications && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            )}
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1 text-stone-600 dark:text-stone-300">설정</span>
          </button>
        </nav>
      )}
    </>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-surface dark:bg-stone-900">
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
