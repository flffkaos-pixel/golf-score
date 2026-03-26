import type { GolfData, Round } from '../types';

const STORAGE_KEY = 'golf_score_data';

export const defaultData: GolfData = {
  player: {
    id: crypto.randomUUID(),
    name: 'golfer',
  },
  rounds: [],
  friends: [],
  competitions: [],
};

export const loadData = (): GolfData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  }
  return defaultData;
};

export const saveData = (data: GolfData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
};

export const generateId = (): string => crypto.randomUUID();

export const formatDate = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const calculateScore = (holes: { par: number; score: number | null }[]) => {
  let totalScore = 0;
  let totalPar = 0;
  
  holes.forEach(hole => {
    if (hole.score !== null) {
      totalScore += hole.score;
      totalPar += hole.par;
    }
  });
  
  return { totalScore, totalPar, relativeScore: totalScore - totalPar };
};

export const createNewRound = (courseName: string): Round => {
  const holes = Array.from({ length: 18 }, (_, i) => ({
    number: i + 1,
    par: 4,
    score: null,
  }));
  
  return {
    id: generateId(),
    date: new Date().toISOString(),
    courseName,
    holes,
    totalScore: 0,
    totalPar: 72,
    relativeScore: 0,
  };
};

export const getScoreDisplay = (relativeScore: number): { text: string; color: string } => {
  if (relativeScore === 0) return { text: 'E', color: 'text-green-400' };
  if (relativeScore > 0) return { text: `+${relativeScore}`, color: 'text-red-400' };
  return { text: `${relativeScore}`, color: 'text-blue-400' };
};
