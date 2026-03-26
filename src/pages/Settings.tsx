import { useAppSettings, type Language } from '../hooks/useAppSettings';
import { useAuth } from '../hooks/useAuth';
import { useGolf } from '../hooks/useGolf';

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
  const { language, setLanguage, darkMode, setDarkMode, t } = useAppSettings();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { clearLocalData } = useGolf();

  const handleSignOut = async () => {
    if (user) {
      await signOut();
    }
    clearLocalData();
    window.location.reload();
  };

  return (
    <div className="min-h-screen pb-32 bg-surface">
      <header className="bg-surface-container-lowest flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <button onClick={onBack} className="p-2 -ml-2">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </button>
        <h1 className="text-xl font-extrabold text-primary font-headline">{t('settings')}</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-6 pt-6 max-w-5xl mx-auto">
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 px-2">{t('profile')}</h2>
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
                    <p className="text-xs score-lime">✓ Google 로그인됨</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-error-container text-error rounded-xl font-bold text-sm"
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
          <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 px-2">{t('appearance')}</h2>
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-secondary">dark_mode</span>
                <span className="font-bold text-primary">{t('darkMode')}</span>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-14 h-8 rounded-full p-1 transition-colors ${darkMode ? 'gradient-primary' : 'bg-surface-container-high'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform flex items-center justify-center ${darkMode ? 'translate-x-6' : ''}`}>
                  {darkMode ? (
                    <span className="text-xs">🌙</span>
                  ) : (
                    <span className="text-xs">☀️</span>
                  )}
                </div>
              </button>
            </div>
            <div className="h-px bg-surface-container" />
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
                        ? 'gradient-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant'
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
          <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 px-2">{t('competitionsInfo')}</h2>
          <button
            className="w-full bg-surface-container-lowest rounded-2xl p-5 flex items-center justify-between active:bg-surface-container transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-secondary">emoji_events</span>
              <span className="font-bold text-primary">{t('competitionsTitle')}</span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
          </button>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 px-2">{t('about')}</h2>
          <div className="bg-surface-container-lowest rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary">GreenScore</span>
              <span className="text-on-surface-variant text-sm">{t('version')} 1.0.0</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
