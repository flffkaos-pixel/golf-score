import { useState, useEffect } from 'react';

type Language = 'ko' | 'en' | 'zh' | 'ja';

const translations = {
  ko: {
    settings: '설정',
    appearance: '외관',
    darkMode: '다크 모드',
    language: '언어',
    profile: '프로필',
    editName: '이름 변경',
    notifications: '알림',
    notificationsDesc: '친구의 라운딩 시작 알림',
    about: '앱 정보',
    version: '버전',
    competitions: '대회 안내',
    competitionsTitle: '대회 기능',
    competitionsDesc: '친구들과 함께 라운딩 대회를 할 수 있어요!',
    competitionsStep1: '대회 만들기',
    competitionsStep2: '친구 초대하기',
    competitionsStep3: '각자 라운딩 후 결과 비교',
    competitionsStep4: '순위 확인하고 결과 공유',
    save: '저장',
    cancel: '취소',
    nameUpdated: '이름이 변경되었습니다',
  },
  en: {
    settings: 'Settings',
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    language: 'Language',
    profile: 'Profile',
    editName: 'Edit Name',
    notifications: 'Notifications',
    notificationsDesc: 'Notify when friends start round',
    about: 'About',
    version: 'Version',
    competitions: 'Competitions',
    competitionsTitle: 'Competition Feature',
    competitionsDesc: 'Compete with friends in golf rounds!',
    competitionsStep1: 'Create Competition',
    competitionsStep2: 'Invite Friends',
    competitionsStep3: 'Play your rounds',
    competitionsStep4: 'Check rankings & share results',
    save: 'Save',
    cancel: 'Cancel',
    nameUpdated: 'Name updated',
  },
  zh: {
    settings: '设置',
    appearance: '外观',
    darkMode: '深色模式',
    language: '语言',
    profile: '个人资料',
    editName: '编辑姓名',
    notifications: '通知',
    notificationsDesc: '朋友开始回合时通知',
    about: '关于',
    version: '版本',
    competitions: '比赛',
    competitionsTitle: '比赛功能',
    competitionsDesc: '与朋友一起参加高尔夫比赛！',
    competitionsStep1: '创建比赛',
    competitionsStep2: '邀请朋友',
    competitionsStep3: '各自进行回合',
    competitionsStep4: '查看排名并分享结果',
    save: '保存',
    cancel: '取消',
    nameUpdated: '姓名已更新',
  },
  ja: {
    settings: '設定',
    appearance: '外観',
    darkMode: 'ダークモード',
    language: '言語',
    profile: 'プロフィール',
    editName: '名前を変更',
    notifications: '通知',
    notificationsDesc: 'ラウンド開始時に通知',
    about: 'アプリについて',
    version: 'バージョン',
    competitions: '大会',
    competitionsTitle: '大会機能',
    competitionsDesc: '友達とゴルフラウンド大会をしよう！',
    competitionsStep1: '大会を作成',
    competitionsStep2: '友達を招待',
    competitionsStep3: '各自ラウンド',
    competitionsStep4: '順位確認と結果共有',
    save: '保存',
    cancel: 'キャンセル',
    nameUpdated: '名前が更新されました',
  },
};

const languageNames = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language;
    return saved || 'ko';
  });
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved !== 'false';
  });
  const [showCompetitions, setShowCompetitions] = useState(false);

  const t = translations[language];

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', String(notificationsEnabled));
  }, [notificationsEnabled]);

  const saveName = () => {
    const data = localStorage.getItem('golf_score_data');
    if (data) {
      const parsed = JSON.parse(data);
      parsed.player.name = newName;
      localStorage.setItem('golf_score_data', JSON.stringify(parsed));
      setPlayerName(newName);
      alert(t.nameUpdated);
    }
    setShowNameEdit(false);
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-stone-900 pb-32">
      <header className="bg-white dark:bg-stone-950 flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40">
        <button onClick={onBack} className="p-2 -ml-2">
          <span className="material-symbols-outlined text-stone-500">arrow_back</span>
        </button>
        <h1 className="text-xl font-extrabold text-primary dark:text-white font-headline">{t.settings}</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-6 pt-6 max-w-5xl mx-auto">
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 px-2">{t.profile}</h2>
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
                  <p className="text-xs text-stone-500">{t.editName}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-stone-400">chevron_right</span>
            </button>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 px-2">{t.appearance}</h2>
          <div className="bg-surface-container-lowest dark:bg-stone-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-secondary">dark_mode</span>
                <span className="font-bold text-primary dark:text-white">{t.darkMode}</span>
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
                <span className="font-bold text-primary dark:text-white">{t.language}</span>
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
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 px-2">{t.notifications}</h2>
          <div className="bg-surface-container-lowest dark:bg-stone-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-secondary">notifications</span>
                <div>
                  <p className="font-bold text-primary dark:text-white">{t.notifications}</p>
                  <p className="text-xs text-stone-500">{t.notificationsDesc}</p>
                </div>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-14 h-8 rounded-full p-1 transition-colors ${notificationsEnabled ? 'bg-primary' : 'bg-stone-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${notificationsEnabled ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 px-2">{t.competitions}</h2>
          <button
            onClick={() => setShowCompetitions(!showCompetitions)}
            className="w-full bg-surface-container-lowest dark:bg-stone-800 rounded-2xl p-5 flex items-center justify-between active:bg-surface-container dark:active:bg-stone-700 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-secondary">emoji_events</span>
              <span className="font-bold text-primary dark:text-white">{t.competitionsTitle}</span>
            </div>
            <span className="material-symbols-outlined text-stone-400">{showCompetitions ? 'expand_less' : 'expand_more'}</span>
          </button>
          {showCompetitions && (
            <div className="bg-surface-container-lowest dark:bg-stone-800 rounded-2xl p-5 mt-2">
              <p className="text-stone-600 dark:text-stone-300 mb-4">{t.competitionsDesc}</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                  <p className="text-sm text-stone-600 dark:text-stone-300">{t.competitionsStep1}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                  <p className="text-sm text-stone-600 dark:text-stone-300">{t.competitionsStep2}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                  <p className="text-sm text-stone-600 dark:text-stone-300">{t.competitionsStep3}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                  <p className="text-sm text-stone-600 dark:text-stone-300">{t.competitionsStep4}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 px-2">{t.about}</h2>
          <div className="bg-surface-container-lowest dark:bg-stone-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary dark:text-white">GreenScore</span>
              <span className="text-stone-500 text-sm">{t.version} 1.0.0</span>
            </div>
          </div>
        </section>
      </main>

      {showNameEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-primary dark:text-white font-headline mb-4">{t.editName}</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-surface-container dark:bg-stone-700 rounded-xl py-4 px-4 text-lg outline-none focus:ring-2 focus:ring-primary text-primary dark:text-white"
              placeholder="이름"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNameEdit(false)}
                className="flex-1 bg-surface-container dark:bg-stone-600 text-stone-600 dark:text-stone-300 py-3 rounded-xl font-bold"
              >
                {t.cancel}
              </button>
              <button
                onClick={saveName}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
