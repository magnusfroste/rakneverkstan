import { useEffect, useState } from "react";
import MathLine from "./components/MathLine";
import Practice from "./components/Practice";
import { LEVELS, LEVEL_META, generateTask, type Level, type Task } from "./lib/equations";
import { accuracy, loadStats, recordAnswer, saveStats, type Stats } from "./lib/stats";

const ROUND_SIZE = 10;

type Mode = Level | "mix";
type Screen = "home" | "play" | "result";

type Entry = { level: Level; attempts: number; correct: boolean };

/** Väljer nivåer till en omgång. "mix" blandar alla sex nivåer jämnt. */
function pickLevels(mode: Mode): Level[] {
  if (mode !== "mix") return Array.from({ length: ROUND_SIZE }, () => mode);
  const out: Level[] = [];
  while (out.length < ROUND_SIZE) {
    const pool = [...LEVELS];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    out.push(...pool);
  }
  return out.slice(0, ROUND_SIZE);
}

function buildRound(mode: Mode): Task[] {
  const list: Task[] = [];
  let previous = "";
  for (const level of pickLevels(mode)) {
    let task = generateTask(level);
    for (let i = 0; i < 8 && task.equationText === previous; i += 1) task = generateTask(level);
    list.push(task);
    previous = task.equationText;
  }
  return list;
}

function Mark() {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-brand text-white shadow-sm">
      <span className="text-[18px] font-extrabold tracking-tight">x=</span>
    </span>
  );
}

function Footer() {
  return (
    <footer className="safe-bottom mt-auto px-4 pb-4 pt-5 text-center text-[12.5px] text-muted">
      Gratis · ingen inloggning · fungerar på iPad
    </footer>
  );
}

function LevelCard({ level, stat, onStart }: { level: Level; stat: Stats["levels"][Level]; onStart: () => void }) {
  const meta = LEVEL_META[level];
  const pct = accuracy(stat);
  const tested = stat.attempts > 0;
  return (
    <button
      type="button"
      onClick={onStart}
      className="card flex w-full flex-col gap-2.5 p-4 text-left transition hover:border-[#d9d2c5] active:scale-[0.995]"
      aria-label={`Nivå ${level}, ${meta.name}, ${meta.example
        .map((p) => (typeof p === "string" ? p : `${p.n}/${p.d}`))
        .join("")}`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="pill">Nivå {level}</span>
        {tested ? (
          <span className="text-[12px] font-semibold text-brand">{pct} % rätt</span>
        ) : (
          <span className="text-[12px] font-medium text-muted">Inte testad</span>
        )}
      </span>

      <span className="flex min-h-[40px] items-center justify-between gap-2">
        <span className="text-[21px] font-semibold leading-none tracking-tight">
          <MathLine parts={meta.example} />
        </span>
        <span aria-hidden className="text-[16px] text-[#b9b1a4]">
          →
        </span>
      </span>

      <span className="block">
        <span className="block text-[15px] font-semibold text-ink">{meta.name}</span>
        <span className="mt-0.5 block min-h-[36px] text-[13px] leading-snug text-muted">{meta.blurb}</span>
      </span>

      <span className="mt-auto block pt-1">
        <span className="block h-1.5 w-full overflow-hidden rounded-full bg-[#efe9df]">
          <span
            className="block h-full rounded-full bg-brand transition-all"
            style={{ width: tested ? `${Math.max(pct, 4)}%` : "0%" }}
          />
        </span>
        <span className="mt-1.5 block text-[12px] text-muted">
          {tested ? `${stat.correct} av ${stat.attempts} rätt · bästa svit ${stat.bestStreak}` : "Inga svar än"}
        </span>
      </span>
    </button>
  );
}

function ScoreRing({ correct, total }: { correct: number; total: number }) {
  const pct = total > 0 ? correct / total : 0;
  const r = 41;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto h-[104px] w-[104px]">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#ece6db" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#2563eb"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[25px] font-extrabold leading-none tracking-tight">
          {correct}
          <span className="text-[16px] font-semibold text-muted">/{total}</span>
        </span>
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">rätt</span>
      </div>
    </div>
  );
}

function Headline({ correct, total }: { correct: number; total: number }) {
  if (correct === total) return <>Allt rätt – du behärskar nivån.</>;
  if (correct >= total - 2) return <>Starkt jobbat. Nästan alla satt.</>;
  if (correct >= total / 2) return <>Bra grund. En omgång till gör skillnad.</>;
  return <>Ta det steg för steg och använd ledtrådarna.</>;
}

export default function App() {
  const [stats, setStats] = useState<Stats>(loadStats);
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<Mode>(1);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [index, setIndex] = useState(0);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestInRound, setBestInRound] = useState(0);

  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  const start = (next: Mode) => {
    setMode(next);
    setTasks(buildRound(next));
    setEntries([]);
    setIndex(0);
    setStreak(0);
    setBestInRound(0);
    setScreen("play");
    window.scrollTo({ top: 0 });
  };

  const handleAttempt = (correct: boolean) => {
    const task = tasks[index];
    if (!task) return;
    const nextStreak = correct ? streak + 1 : 0;
    setStreak(nextStreak);
    setBestInRound((b) => Math.max(b, nextStreak));
    setStats((s) => recordAnswer(s, task.level, correct, nextStreak));
    setEntries((prev) => {
      const copy = prev.slice(0, index);
      const current = prev[index] ?? { level: task.level, attempts: 0, correct: false };
      copy[index] = {
        level: task.level,
        attempts: current.attempts + 1,
        correct: current.correct || correct,
      };
      return copy;
    });
  };

  const handleNext = () => {
    const task = tasks[index];
    setEntries((prev) => {
      if (prev[index] || !task) return prev;
      const copy = prev.slice(0, index);
      copy[index] = { level: task.level, attempts: 0, correct: false };
      return copy;
    });
    if (index + 1 >= tasks.length) {
      setScreen("result");
      window.scrollTo({ top: 0 });
    } else {
      setIndex(index + 1);
    }
  };

  const goHome = () => {
    setScreen("home");
    window.scrollTo({ top: 0 });
  };

  const correctCount = entries.filter((e) => e.correct).length;
  const marks = tasks.map((_, i) => (entries[i] ? entries[i].correct : null));

  const perLevel = LEVELS.map((level) => {
    const rows = entries.filter((e) => e.level === level);
    return {
      level,
      total: rows.length,
      correct: rows.filter((e) => e.correct).length,
      attempts: rows.reduce((sum, e) => sum + e.attempts, 0),
    };
  }).filter((row) => row.total > 0);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {screen === "home" && (
        <main className="mx-auto w-full max-w-[1000px] px-4 pb-2 pt-5 sm:px-6 sm:pt-7">
          <header className="flex items-center gap-3">
            <Mark />
            <div className="min-w-0">
              <h1 className="text-[25px] font-extrabold leading-tight tracking-tight sm:text-[28px]">Räkneverkstan</h1>
              <p className="text-[13px] leading-snug text-muted">Ekvationer steg för steg · åk 7–9</p>
            </div>
          </header>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-[17px] font-semibold">Välj nivå</h2>
              <p className="mt-0.5 text-[13px] text-muted">Tio uppgifter per omgång. Ledtråd och hela lösningen finns om du kör fast.</p>
            </div>
            <div className="hidden items-center gap-2 text-[12.5px] text-muted sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
              Inga konton, inga kakor
            </div>
          </div>

          <div className="mt-3 grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LEVELS.map((level) => (
              <LevelCard key={level} level={level} stat={stats.levels[level]} onStart={() => start(level)} />
            ))}
          </div>

          <div className="mt-3 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <button type="button" className="btn-ghost w-full sm:w-auto" onClick={() => start("mix")}>
              Blanda alla nivåer
            </button>
            <p className="text-center text-[12.5px] text-muted sm:text-left">Tio uppgifter från alla sex nivåer.</p>
          </div>
        </main>
      )}

      {screen === "play" && tasks.length > 0 && (
        <Practice
          key={`${tasks[index].id}-${index}`}
          task={tasks[index]}
          index={index}
          total={tasks.length}
          streak={streak}
          correctCount={correctCount}
          marks={marks}
          onAttempt={handleAttempt}
          onNext={handleNext}
          onQuit={goHome}
        />
      )}

      {screen === "result" && (
        <main className="mx-auto w-full max-w-[720px] px-4 pb-2 pt-6">
          <div className="card px-5 py-6 text-center">
            <p className="text-[13px] font-medium text-muted">
              {mode === "mix" ? "Blandade nivåer" : `Nivå ${mode} · ${LEVEL_META[mode].name}`}
            </p>
            <h2 className="mt-1 text-[23px] font-extrabold tracking-tight">Omgången är klar</h2>
            <div className="mt-4">
              <ScoreRing correct={correctCount} total={entries.length || ROUND_SIZE} />
            </div>
            <p className="mx-auto mt-3 max-w-[420px] text-[14px] leading-snug text-muted">
              <Headline correct={correctCount} total={entries.length || ROUND_SIZE} />
            </p>
            {bestInRound >= 3 && (
              <p className="mt-1.5 text-[13px] font-semibold text-brand">Bästa sviten i omgången: {bestInRound} rätt i rad</p>
            )}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button type="button" className="btn-primary sm:min-w-[170px]" onClick={() => start(mode)}>
                Kör igen
              </button>
              <button type="button" className="btn-ghost sm:min-w-[170px]" onClick={goHome}>
                Välj nivå
              </button>
            </div>
          </div>

          <div className="card mt-3 px-4 py-4">
            <h3 className="text-[15px] font-semibold">Så gick det per nivå</h3>
            <ul className="mt-2 divide-y divide-line">
              {perLevel.map((row) => {
                const all = row.correct === row.total;
                return (
                  <li key={row.level} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                          all ? "bg-[#eaf4ee] text-good" : "bg-[#f3eee4] text-muted"
                        }`}
                        aria-hidden
                      >
                        {all ? "✓" : row.level}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold leading-tight">{LEVEL_META[row.level].name}</p>
                        <p className="text-[12px] text-muted">
                          Nivå {row.level} · {row.attempts} försök
                        </p>
                      </div>
                    </div>
                    <p className={`shrink-0 text-[13.5px] font-semibold ${all ? "text-good" : "text-ink"}`}>
                      {row.correct} av {row.total} rätt
                    </p>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-[12.5px] leading-snug text-muted">
              Statistiken sparas bara i webbläsaren på den här enheten.
            </p>
          </div>
        </main>
      )}

      <Footer />
    </div>
  );
}