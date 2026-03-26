import { useState } from 'react';
import { useAppSettings, type Language } from '../hooks/useAppSettings';

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
    <div className="min-h-screen pb-32 bg-surface dark:bg-stone-900">
      <header className="bg-white dark:bg-stone-950 flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <button onClick={onBack} className="p-2 -ml-2">
          <span className="material-symbols-outlined text-stone-500">arrow_back</span>
        </button>
        <h1 className="text-xl font-extrabold text-primary dark:text-white font-headline">{t('settings')}</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-6 pt-6 max-w-5xl mx-auto">
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 px-2">{t('profile')}</h2>
          <div className="bg-surface-container-lowest dark:bg-stone-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowNameEdit(true)}
              className="w-full flex items-center justify-between p-5 active:bg-surface-container dark:active:bg-stone-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center">
                  <span className="text-xl">⛳</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-primary dark:text-white">{playerName}</p>
                  <p className="text-xs text-stone-500">{t('editName')}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-stone-400">chevron_right</span>
            </button>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 px-2">{t('appearance')}</h2>
          <div className="bg-surface-container-lowest dark:bg-stone-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-secondary">dark_mode</span>
                <span className="font-bold text-primary dark:text-white">{t('darkMode')}</span>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-14 h-8 rounded-full p-1 transition-colors ${darkMode ? 'bg-primary' : 'bg-stone-300'}`}
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
            <div className="h-px bg-stone-200 dark:bg-stone-700" />
            <div className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <span className="material-symbols-outlined text-secondary">language</span>
                <span className="font-bold text-primary dark:text-white">{t('language')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(languageNames) as Language[]).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-colors ${
                      language === lang
                        ? 'bg-primary text-white'
                        : 'bg-surface-container dark:bg-stone-700 text-stone-600 dark:text-stone-300'
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
            className="w-full bg-surface-container-lowest dark:bg-stone-800 rounded-2xl p-5 flex items-center justify-between active:bg-surface-container dark:active:bg-stone-700 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-secondary">emoji_events</span>
              <span className="font-bold text-primary dark:text-white">{t('competitionsTitle')}</span>
            </div>
            <span className="material-symbols-outlined text-stone-400">{showCompetitions ? 'expand_less' : 'expand_more'}</span>
          </button>
          {showCompetitions && (
            <div className="bg-surface-container-lowest dark:bg-stone-800 rounded-2xl p-5 mt-2">
              <p className="text-stone-600 dark:text-stone-300 mb-4">{t('competitionsDesc')}</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                  <p className="text-sm text-stone-600 dark:text-stone-300">{t('compStep1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                  <p className="text-sm text-stone-600 dark:text-stone-300">{t('compStep2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                  <p className="text-sm text-stone-600 dark:text-stone-300">{t('compStep3')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                  <p className="text-sm text-stone-600 dark:text-stone-300">{t('compStep4')}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 px-2">{t('about')}</h2>
          <div className="bg-surface-container-lowest dark:bg-stone-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary dark:text-white">GreenScore</span>
              <span className="text-stone-500 text-sm">{t('version')} 1.0.0</span>
            </div>
          </div>
        </section>
      </main>

      {showNameEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-primary dark:text-white font-headline mb-4">{t('editName')}</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-surface-container dark:bg-stone-700 rounded-xl py-4 px-4 text-lg outline-none focus:ring-2 focus:ring-primary text-primary dark:text-white"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNameEdit(false)}
                className="flex-1 bg-surface-container dark:bg-stone-600 text-stone-600 dark:text-stone-300 py-3 rounded-xl font-bold"
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
