/**
 * Uppgiftsgenerator och lösare för Räkneverkstan.
 *
 * Varje uppgift byggs baklänges från ett heltaligt svar, så att svaret alltid
 * går att räkna ut exakt. Stegen skrivs ut som text + en rad med matematik,
 * och svaret kontrolleras med bråkräkning (täljare/nämnare) så att även svar
 * som "12/3" eller "4,0" godkänns.
 */

export type Level = 1 | 2 | 3 | 4 | 5 | 6;

export type Rational = { n: number; d: number };

/** En del av en ekvationsrad: vanlig text eller ett staplat bråk. */
export type Part = string | { n: string; d: string };
export type Line = Part[];

export type Step = { instruction: string; line?: Line };

export type Task = {
  id: string;
  level: Level;
  equation: Line;
  equationText: string;
  answer: Rational;
  answerText: string;
  steps: Step[];
  hint: string;
  /** Sant för x² = a, där även den negativa roten är ett godkänt svar. */
  acceptNegative?: boolean;
  note?: string;
};

export const LEVELS: Level[] = [1, 2, 3, 4, 5, 6];

export const LEVEL_META: Record<Level, { name: string; example: Line; blurb: string }> = {
  1: {
    name: "Plus och minus",
    example: ["x + 7 = 12"],
    blurb: "Flytta bort talet så att x står ensamt.",
  },
  2: {
    name: "Multiplikation",
    example: ["4x = 28"],
    blurb: "Dela båda sidor med talet framför x.",
  },
  3: {
    name: "Två räknesätt",
    example: ["3x + 4 = 19"],
    blurb: "Subtrahera först, dela sedan.",
  },
  4: {
    name: "X på båda sidor",
    example: ["5x + 2 = 2x + 14"],
    blurb: "Samla alla x på samma sida.",
  },
  5: {
    name: "Parenteser",
    example: ["3(x + 2) = 18"],
    blurb: "Dela först så att parentesen försvinner.",
  },
  6: {
    name: "Rötter och bråk",
    example: [{ n: "2x", d: "3" }, " = 4"],
    blurb: "Kvadratrötter och ekvationer med bråk.",
  },
};

/* ------------------------------------------------------------------ */
/* Hjälpfunktioner                                                     */
/* ------------------------------------------------------------------ */

const MINUS = "\u2212";

/** Minustecken som ser rätt ut i text (U+2212 i stället för bindestreck). */
export function num(v: number): string {
  return String(v).replace("-", MINUS);
}

/** Koefficient framför x: 1 -> "x", 2 -> "2x". */
function coeff(a: number): string {
  if (a === 1) return "x";
  if (a === -1) return `${MINUS}x`;
  return `${num(a)}x`;
}

/** "3x + 4", "3x − 4" eller "3x" beroende på b. */
function withConst(term: string, b: number): string {
  if (b === 0) return term;
  if (b > 0) return `${term} + ${num(b)}`;
  return `${term} ${MINUS} ${num(Math.abs(b))}`;
}

function randInt(min: number, max: number, rand: () => number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a || 1;
}

export function reduce(n: number, d: number): Rational {
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

let seq = 0;

/* ------------------------------------------------------------------ */
/* Generator                                                           */
/* ------------------------------------------------------------------ */

export function generateTask(level: Level, rand: () => number = Math.random): Task {
  seq += 1;
  const id = `u${seq}`;
  switch (level) {
    case 1:
      return sumTask(id, rand);
    case 2:
      return productTask(id, rand);
    case 3:
      return twoStepTask(id, rand);
    case 4:
      return bothSidesTask(id, rand);
    case 5:
      return parenthesesTask(id, rand);
    default:
      return rand() < 0.5 ? squareTask(id, rand) : fractionTask(id, rand);
  }
}

/** Nivå 1: x + a = b (ibland a + x = b). */
function sumTask(id: string, rand: () => number): Task {
  const x = randInt(2, 18, rand);
  const a = randInt(2, 12, rand);
  const b = x + a;
  const flipped = rand() < 0.25;
  const equation: Line = flipped ? [`${num(a)} + x = ${num(b)}`] : [`x + ${num(a)} = ${num(b)}`];
  return {
    id,
    level: 1,
    equation,
    equationText: flipped ? `${a} + x = ${b}` : `x + ${a} = ${b}`,
    answer: { n: x, d: 1 },
    answerText: num(x),
    hint: `x ska stå ensamt. Subtrahera ${num(a)} från båda sidor.`,
    steps: [
      {
        instruction: `Subtrahera ${num(a)} från båda sidor.`,
        line: [`x = ${num(b)} ${MINUS} ${num(a)}`],
      },
      { instruction: "Räkna ut skillnaden.", line: [`x = ${num(x)}`] },
    ],
  };
}

/** Nivå 2: ax = b. */
function productTask(id: string, rand: () => number): Task {
  const a = randInt(2, 9, rand);
  const x = randInt(2, 12, rand);
  const b = a * x;
  return {
    id,
    level: 2,
    equation: [`${num(a)}x = ${num(b)}`],
    equationText: `${a}x = ${b}`,
    answer: { n: x, d: 1 },
    answerText: num(x),
    hint: `x multipliceras med ${num(a)}. Dela därför båda sidor med ${num(a)}.`,
    steps: [
      {
        instruction: `Dela båda sidor med ${num(a)}.`,
        line: [`x = `, { n: num(b), d: num(a) }],
      },
      { instruction: "Räkna ut.", line: [`x = ${num(x)}`] },
    ],
  };
}

/** Nivå 3: ax + b = c. */
function twoStepTask(id: string, rand: () => number): Task {
  const a = randInt(2, 9, rand);
  const x = randInt(2, 12, rand);
  const b = randInt(1, 15, rand);
  const c = a * x + b;
  const left = withConst(coeff(a), b);
  return {
    id,
    level: 3,
    equation: [`${left} = ${num(c)}`],
    equationText: `${left} = ${c}`,
    answer: { n: x, d: 1 },
    answerText: num(x),
    hint: `Börja med att bli av med ${num(b)}: subtrahera ${num(b)} från båda sidor.`,
    steps: [
      {
        instruction: `Subtrahera ${num(b)} från båda sidor.`,
        line: [`${coeff(a)} = ${num(c - b)}`],
      },
      {
        instruction: `Dela båda sidor med ${num(a)}.`,
        line: [`x = `, { n: num(c - b), d: num(a) }],
      },
      { instruction: "Räkna ut.", line: [`x = ${num(x)}`] },
    ],
  };
}

/** Nivå 4: ax + b = cx + d. */
function bothSidesTask(id: string, rand: () => number): Task {
  const c = randInt(1, 5, rand);
  const k = randInt(2, 5, rand);
  const a = c + k;
  const b = randInt(0, 9, rand);
  const x = randInt(2, 9, rand);
  const d = b + k * x;

  const left = withConst(coeff(a), b);
  const right = withConst(coeff(c), d);

  const steps: Step[] = [
    {
      instruction: `Subtrahera ${coeff(c)} från båda sidor.`,
      line: [`${withConst(coeff(k), b)} = ${num(d)}`],
    },
  ];
  if (b !== 0) {
    steps.push({
      instruction: `Subtrahera ${num(b)} från båda sidor.`,
      line: [`${coeff(k)} = ${num(d - b)}`],
    });
  }
  if (k !== 1) {
    steps.push({
      instruction: `Dela båda sidor med ${num(k)}.`,
      line: [`x = `, { n: num(d - b), d: num(k) }],
    });
  }
  steps.push({ instruction: "Räkna ut.", line: [`x = ${num(x)}`] });

  return {
    id,
    level: 4,
    equation: [`${left} = ${right}`],
    equationText: `${left} = ${right}`,
    answer: { n: x, d: 1 },
    answerText: num(x),
    hint: `Samla x på ena sidan: subtrahera ${coeff(c)} från båda sidor.`,
    steps,
  };
}

/** Nivå 5: a(x + b) = c. */
function parenthesesTask(id: string, rand: () => number): Task {
  const a = randInt(2, 9, rand);
  const b = randInt(1, 9, rand);
  const x = randInt(2, 9, rand);
  const c = a * (x + b);
  return {
    id,
    level: 5,
    equation: [`${num(a)}(x + ${num(b)}) = ${num(c)}`],
    equationText: `${a}(x + ${b}) = ${c}`,
    answer: { n: x, d: 1 },
    answerText: num(x),
    hint: `Parentesen multipliceras med ${num(a)}. Dela båda sidor med ${num(a)} först.`,
    steps: [
      {
        instruction: `Dela båda sidor med ${num(a)}.`,
        line: [`x + ${num(b)} = ${num(c / a)}`],
      },
      {
        instruction: `Subtrahera ${num(b)} från båda sidor.`,
        line: [`x = ${num(c / a)} ${MINUS} ${num(b)}`],
      },
      { instruction: "Räkna ut.", line: [`x = ${num(x)}`] },
    ],
  };
}

/** Nivå 6a: x² = a, där a är en jämn kvadrat. */
function squareTask(id: string, rand: () => number): Task {
  const x = randInt(2, 12, rand);
  const a = x * x;
  return {
    id,
    level: 6,
    equation: [`x² = ${num(a)}`],
    equationText: `x² = ${a}`,
    answer: { n: x, d: 1 },
    answerText: num(x),
    acceptNegative: true,
    hint: `Tänk efter: vilket tal gånger sig självt blir ${num(a)}?`,
    note: `Både ${num(x)} och ${num(-x)} är lösningar, eftersom (${MINUS}${num(x)})² = ${num(a)}.`,
    steps: [
      {
        instruction: "Dra kvadratroten ur båda sidor.",
        line: [`x = √${num(a)}`],
      },
      { instruction: "Räkna ut roten.", line: [`x = ${num(x)}`] },
    ],
  };
}

/** Nivå 6b: (a·x)/b = c, till exempel 2x/3 = 4. */
function fractionTask(id: string, rand: () => number): Task {
  // Välj a, b, x så att a·x går jämnt upp i b – då blir c ett heltal.
  // Bråket ska vara förkortat och inte gå jämnt upp, annars blir uppgiften
  // trivial (som 5x/5 = 6).
  let a = 2;
  let b = 3;
  let x = 6;
  for (let i = 0; i < 800; i += 1) {
    const na = randInt(1, 8, rand);
    const nb = randInt(2, 10, rand);
    const nx = randInt(2, 12, rand);
    if (gcd(na, nb) !== 1 || na % nb === 0) continue;
    if ((na * nx) % nb !== 0) continue;
    if ((na * nx) / nb < 1) continue;
    a = na;
    b = nb;
    x = nx;
    break;
  }
  const c = (a * x) / b;
  const numerator = a === 1 ? "x" : `${num(a)}x`;
  return {
    id,
    level: 6,
    equation: [{ n: numerator, d: num(b) }, ` = ${num(c)}`],
    equationText: `${numerator}/${b} = ${c}`,
    answer: { n: x, d: 1 },
    answerText: num(x),
    hint: `Multiplicera båda sidor med ${num(b)} så försvinner nämnaren.`,
    steps: [
      {
        instruction: `Multiplicera båda sidor med ${num(b)}.`,
        line: [`${coeff(a)} = ${num(a * x)}`],
      },
      {
        instruction: a === 1 ? "Nu står x ensamt." : `Dela båda sidor med ${num(a)}.`,
        line: a === 1 ? [`x = ${num(x)}`] : [`x = `, { n: num(a * x), d: num(a) }],
      },
      { instruction: "Räkna ut.", line: [`x = ${num(x)}`] },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Rättning                                                            */
/* ------------------------------------------------------------------ */

function decimalToFraction(text: string): Rational | null {
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(text);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  const whole = Number(m[2]);
  const decimals = m[3] ?? "";
  const d = Math.pow(10, decimals.length);
  const n = whole * d + (decimals ? Number(decimals) : 0);
  return reduce(sign * n, d);
}

/** Tolkar elevens svar: "4", "−4", "4,5", "12/3", "x = 4". */
export function parseAnswer(raw: string): Rational | null {
  let s = raw.trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/\s+/g, "");
  s = s.replace(/[\u2212\u2013\u2014]/g, "-");
  s = s.replace(/,/g, ".");
  // Tillåt att eleven skriver med x, till exempel "x = 4" eller "x4".
  s = s.replace(/^x=?/, "");
  s = s.replace(/^\+\+?/, "");
  if (!s) return null;
  if (!/^-?(\d+(\.\d+)?|\d+(\.\d+)?\/\d+(\.\d+)?)$/.test(s)) return null;

  if (s.includes("/")) {
    const [left, right] = s.split("/");
    const ln = decimalToFraction(left);
    const rn = decimalToFraction(right);
    if (!ln || !rn || rn.n === 0) return null;
    // (ln.n/ln.d) / (rn.n/rn.d)
    return reduce(ln.n * rn.d, ln.d * rn.n);
  }
  return decimalToFraction(s);
}

export function sameValue(a: Rational, b: Rational): boolean {
  return a.n * b.d === b.n * a.d;
}

export type Check = { ok: boolean; value: Rational | null };

export function checkAnswer(task: Task, raw: string): Check {
  const value = parseAnswer(raw);
  if (!value) return { ok: false, value: null };
  const ok = sameValue(value, task.answer) || (!!task.acceptNegative && sameValue(value, { n: -task.answer.n, d: task.answer.d }));
  return { ok, value };
}