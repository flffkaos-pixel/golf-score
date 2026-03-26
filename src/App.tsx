import { useState } from 'react';
import { GolfProvider } from './hooks/useGolf';
import Home from './pages/Home';
import PlayGame from './pages/PlayGame';
import Friends from './pages/Friends';
import Competitions from './pages/Competitions';
import Stats from './pages/Stats';

type Page = 'home' | 'play' | 'friends' | 'competitions' | 'stats';

function AppContent() {
  const [page, setPage] = useState<Page>('home');

  const navigate = (newPage: Page) => setPage(newPage);

  return (
    <div className="min-h-screen">
      {page === 'home' && <Home onStartGame={() => navigate('play')} />}
      {page === 'play' && <PlayGame onBack={() => navigate('home')} onComplete={() => navigate('home')} />}
      {page === 'friends' && <Friends onBack={() => navigate('home')} />}
      {page === 'competitions' && <Competitions onBack={() => navigate('home')} />}
      {page === 'stats' && <Stats onBack={() => navigate('home')} />}

      {page !== 'play' && (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/70 dark:bg-stone-950/70 backdrop-blur-md shadow-[0_-4px_24px_rgba(25,28,29,0.06)] rounded-t-[1.5rem]">
          <button
            onClick={() => navigate('home')}
            className={`flex flex-col items-center justify-center px-5 py-2 transition-transform active:scale-90 ${
              page === 'home' 
                ? 'bg-lime-400/20 text-primary rounded-2xl' 
                : 'text-stone-500'
            }`}
          >
            <span className="material-symbols-outlined" style={page === 'home' ? {fontVariationSettings: "'FILL' 1"} : {}}>
              dashboard
            </span>
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1">Home</span>
          </button>
          <button
            onClick={() => navigate('competitions')}
            className={`flex flex-col items-center justify-center px-5 py-2 transition-transform active:scale-90 ${
              page === 'competitions' 
                ? 'bg-lime-400/20 text-primary rounded-2xl' 
                : 'text-stone-500'
            }`}
          >
            <span className="material-symbols-outlined" style={page === 'competitions' ? {fontVariationSettings: "'FILL' 1"} : {}}>
              emoji_events
            </span>
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1">대회</span>
          </button>
          <button
            onClick={() => navigate('friends')}
            className={`flex flex-col items-center justify-center px-5 py-2 transition-transform active:scale-90 ${
              page === 'friends' 
                ? 'bg-lime-400/20 text-primary rounded-2xl' 
                : 'text-stone-500'
            }`}
          >
            <span className="material-symbols-outlined" style={page === 'friends' ? {fontVariationSettings: "'FILL' 1"} : {}}>
              group
            </span>
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1">친구</span>
          </button>
          <button
            onClick={() => navigate('stats')}
            className={`flex flex-col items-center justify-center px-5 py-2 transition-transform active:scale-90 ${
              page === 'stats' 
                ? 'bg-lime-400/20 text-primary rounded-2xl' 
                : 'text-stone-500'
            }`}
          >
            <span className="material-symbols-outlined" style={page === 'stats' ? {fontVariationSettings: "'FILL' 1"} : {}}>
              insights
            </span>
            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1">Stats</span>
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
