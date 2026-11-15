/**
 * Statistik per nivå i localStorage. Nyckeln är rakneverkstan-v1 och allt
 * stannar i webbläsaren – ingen spårning, inga kakor, ingen server.
 */

import { LEVELS, type Level } from "./equations";

export const STORAGE_KEY = "rakneverkstan-v1";

export type LevelStat = {
  correct: number;
  attempts: number;
  bestStreak: number;
};

export type Stats = {
  v: 1;
  levels: Record<Level, LevelStat>;
};

export function emptyStat(): LevelStat {
  return { correct: 0, attempts: 0, bestStreak: 0 };
}

export function emptyStats(): Stats {
  const levels = {} as Record<Level, LevelStat>;
  for (const level of LEVELS) levels[level] = emptyStat();
  return { v: 1, levels };
}

function toCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/** Läser statistiken och lagar trasiga värden i stället för att krascha. */
export function loadStats(): Stats {
  const fresh = emptyStats();
  if (typeof window === "undefined" || !window.localStorage) return fresh;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw) as Partial<Stats> | null;
    if (!parsed || typeof parsed !== "object" || !parsed.levels) return fresh;
    for (const level of LEVELS) {
      const saved = (parsed.levels as Record<string, unknown>)[String(level)];
      if (!saved || typeof saved !== "object") continue;
      const s = saved as Record<string, unknown>;
      fresh.levels[level] = {
        correct: toCount(s.correct),
        attempts: toCount(s.attempts),
        bestStreak: toCount(s.bestStreak),
      };
    }
    return fresh;
  } catch {
    return fresh;
  }
}

export function saveStats(stats: Stats): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    /* Fullt lagringsutrymme eller privat läge – appen fungerar ändå. */
  }
}

/**
 * Registrerar ett svar. `streak` är den svit eleven har efter svaret, så att
 * bästa svit kan sparas per nivå.
 */
export function recordAnswer(stats: Stats, level: Level, correct: boolean, streak: number): Stats {
  const prev = stats.levels[level] ?? emptyStat();
  return {
    ...stats,
    levels: {
      ...stats.levels,
      [level]: {
        correct: prev.correct + (correct ? 1 : 0),
        attempts: prev.attempts + 1,
        bestStreak: Math.max(prev.bestStreak, correct ? streak : 0),
      },
    },
  };
}

export function clearStats(): Stats {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignoreras */
    }
  }
  return emptyStats();
}

/** Andel rätt i procent, 0–100. */
export function accuracy(stat: LevelStat): number {
  if (stat.attempts === 0) return 0;
  return Math.round((stat.correct / stat.attempts) * 100);
}