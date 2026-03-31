import { useState } from 'react';
import { useAppSettings, type Language } from '../hooks/useAppSettings';
import { useAuth } from '../hooks/useAuth';

const languageNames: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const { language, setLanguage, t } = useAppSettings();
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  const handleSignOut = async () => {
    if (user) {
      await signOut();
    }
    window.location.reload();
  };
  const [playerName, setPlayerName] = useState(() => {
    const data = localStorage.getItem('golf_score_data');
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.player?.name || 'golfer';
    }
    return 'golfer';
  });
  const [newName, setNewName] = useState(playerName);
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [showCompetitions, setShowCompetitions] = useState(false);

  const saveName = () => {
    const data = localStorage.getItem('golf_score_data');
    if (data) {
      const parsed = JSON.parse(data);
      parsed.player.name = newName;
      localStorage.setItem('golf_score_data', JSON.stringify(parsed));
      setPlayerName(newName);
    }
    setShowNameEdit(false);
    alert(t('nameUpdated'));
  };

  return (
    <div className="min-h-screen pb-32 bg-surface">
      <header className="bg-white flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <button onClick={onBack} className="p-2 -ml-2">
          <span className="material-symbols-outlined text-stone-500">arrow_back</span>
        </button>
        <h1 className="text-xl font-extrabold text-primary font-headline">{t('settings')}</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-6 pt-6 max-w-5xl mx-auto">
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 px-2">{t('profile')}</h2>
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden">
            {user ? (
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center">
                      <span className="text-xl">👤</span>
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-bold text-primary">{user.user_metadata?.full_name || user.user_metadata?.name || user.email}</p>
                    <p className="text-xs text-green-600">
                      ✓ Google 로그인됨
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-bold text-sm"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 p-5 active:bg-surface-container transition-colors disabled:opacity-50"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-bold text-primary">Google로 로그인</span>
              </button>
            )}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 px-2">내 프로필</h2>
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden">
            <button
              onClick={() => { setNewName(playerName); setShowNameEdit(true); }}
              className="w-full p-5 flex items-center justify-between active:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-secondary">person</span>
                <div className="text-left">
                  <p className="text-xs text-stone-500 font-bold">이름</p>
                  <p className="font-bold text-primary">{playerName}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-stone-400">chevron_right</span>
            </button>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 px-2">{t('appearance')}</h2>
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <span className="material-symbols-outlined text-secondary">language</span>
                <span className="font-bold text-primary">{t('language')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(languageNames) as Language[]).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-colors ${
                      language === lang
                        ? 'bg-primary text-white'
                        : 'bg-surface-container text-stone-600'
                    }`}
                  >
                    {languageNames[lang]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 px-2">{t('competitionsInfo')}</h2>
          <button
            onClick={() => setShowCompetitions(!showCompetitions)}
            className="w-full bg-surface-container-lowest rounded-2xl p-5 flex items-center justify-between active:bg-surface-container transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-secondary">emoji_events</span>
              <span className="font-bold text-primary">{t('competitionsTitle')}</span>
            </div>
            <span className="material-symbols-outlined text-stone-400">{showCompetitions ? 'expand_less' : 'expand_more'}</span>
          </button>
          {showCompetitions && (
            <div className="bg-surface-container-lowest rounded-2xl p-5 mt-2">
              <p className="text-stone-600 mb-4">{t('competitionsDesc')}</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                  <p className="text-sm text-stone-600">{t('compStep1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                  <p className="text-sm text-stone-600">{t('compStep2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                  <p className="text-sm text-stone-600">{t('compStep3')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                  <p className="text-sm text-stone-600">{t('compStep4')}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 px-2">{t('about')}</h2>
          <div className="bg-surface-container-lowest rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary">GreenScore</span>
              <span className="text-stone-500 text-sm">{t('version')} 1.0.0</span>
            </div>
          </div>
        </section>
      </main>

      {showNameEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-primary font-headline mb-4">이름 변경</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-surface-container rounded-xl py-4 px-4 text-lg outline-none focus:ring-2 focus:ring-primary text-primary"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNameEdit(false)}
                className="flex-1 bg-surface-container text-stone-600 py-3 rounded-xl font-bold"
              >
                {t('cancel')}
              </button>
              <button
                onClick={saveName}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
