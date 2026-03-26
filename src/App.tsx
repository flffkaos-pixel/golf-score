import { useState } from 'react';
import { GolfProvider } from './hooks/useGolf';
import Home from './pages/Home';
import PlayGame from './pages/PlayGame';
import Friends from './pages/Friends';
import Competitions from './pages/Competitions';
import Stats from './pages/Stats';
import History from './pages/History';
import Settings from './pages/Settings';

type Page = 'home' | 'play' | 'friends' | 'competitions' | 'stats' | 'history' | 'settings';

function AppContent() {
  const [page, setPage] = useState<Page>('home');

  const navigate = (newPage: Page) => setPage(newPage);

  const isActive = (p: Page) => page === p;

  return (
    <div className="min-h-screen">
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
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1">Home</span>
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
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1">기록</span>
          </button>
          <button
            onClick={() => navigate('competitions')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 ${
              isActive('competitions') ? 'bg-lime-400/20 text-primary dark:bg-lime-900/30 dark:text-lime-300 rounded-2xl' : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <span className="material-symbols-outlined" style={isActive('competitions') ? {fontVariationSettings: "'FILL' 1"} : {}}>
              emoji_events
            </span>
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1">대회</span>
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
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1">Stats</span>
          </button>
          <button
            onClick={() => navigate('settings')}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-transform active:scale-90 ${
              isActive('settings') ? 'bg-lime-400/20 text-primary dark:bg-lime-900/30 dark:text-lime-300 rounded-2xl' : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <span className="material-symbols-outlined" style={isActive('settings') ? {fontVariationSettings: "'FILL' 1"} : {}}>
              settings
            </span>
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1">설정</span>
          </button>
        </nav>
      )}
    </div>
  );
}

function App() {
  return (
    <GolfProvider>
      <AppContent />
    </GolfProvider>
  );
}

export default App;
