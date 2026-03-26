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
    <div className="min-h-screen pb-20">
      {page === 'home' && <Home onStartGame={() => navigate('play')} />}
      {page === 'play' && <PlayGame onBack={() => navigate('home')} onComplete={() => navigate('home')} />}
      {page === 'friends' && <Friends onBack={() => navigate('home')} />}
      {page === 'competitions' && <Competitions onBack={() => navigate('home')} />}
      {page === 'stats' && <Stats onBack={() => navigate('home')} />}

      {page !== 'play' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-green-900/95 backdrop-blur border-t border-white/10">
          <div className="flex justify-around py-2">
            <button
              onClick={() => navigate('home')}
              className={`flex flex-col items-center p-2 ${page === 'home' ? 'text-green-400' : 'text-white/60'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs mt-1">홈</span>
            </button>
            <button
              onClick={() => navigate('competitions')}
              className={`flex flex-col items-center p-2 ${page === 'competitions' ? 'text-green-400' : 'text-white/60'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="text-xs mt-1">대회</span>
            </button>
            <button
              onClick={() => navigate('friends')}
              className={`flex flex-col items-center p-2 ${page === 'friends' ? 'text-green-400' : 'text-white/60'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs mt-1">친구</span>
            </button>
            <button
              onClick={() => navigate('stats')}
              className={`flex flex-col items-center p-2 ${page === 'stats' ? 'text-green-400' : 'text-white/60'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-xs mt-1">통계</span>
            </button>
          </div>
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
