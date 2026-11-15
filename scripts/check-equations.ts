/**
 * Egenkontroll av uppgiftsgeneratorn.
 *
 * Körs med:  node scripts/check-equations.ts   (eller npm run test:generator)
 *
 * Testet sätter in det påstådda svaret i den genererade ekvationen och räknar
 * ut båda sidor med en liten oberoende utvärderare. Det kontrollerar alltså
 * generatorn, inte bara lösaren. Varje steg i lösningen kontrolleras också,
 * så att inget steg påstår något som inte stämmer.
 */

import {
  LEVELS,
  checkAnswer,
  generateTask,
  parseAnswer,
  sameValue,
  type Level,
  type Task,
} from "../src/lib/equations";
import { emptyStats, recordAnswer } from "../src/lib/stats";

const PER_LEVEL = 400;
let failures = 0;

function fail(message: string) {
  failures += 1;
  console.error("  FEL: " + message);
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gör om ekvationstext till ett uttryck som JavaScript kan räkna ut. */
function normalise(text: string): string {
  return text
    .replace(/\u2212/g, "-")
    .replace(/²/g, "^2")
    .replace(/\s+/g, "")
    .replace(/(\d)x/g, "$1*x")
    .replace(/(\d)\(/g, "$1*(")
    .replace(/\)\(/g, ")*(");
}

function calc(expr: string, x: number): number {
  const js = expr.replace(/\^/g, "**");
  // Endast siffror och räknetecken når hit – indata kommer från generatorn.
  return new Function("x", `"use strict"; return (${js});`)(x) as number;
}

function bothSides(text: string, x: number): [number, number] {
  const norm = normalise(text);
  const parts = norm.split("=");
  if (parts.length !== 2) throw new Error("Ekvationen har inte två sidor: " + text);
  return [calc(parts[0], x), calc(parts[1], x)];
}

function lineText(task: Task, index: number): string {
  const line = task.steps[index]?.line;
  if (!line) return "";
  return line
    .map((part) => (typeof part === "string" ? part : `${part.n}/${part.d}`))
    .join("");
}

function describe(task: Task): string {
  return `${task.equationText}  (svar ${task.answerText})`;
}

/** Kontrollerar en uppgift: svaret ska lösa ekvationen och alla steg stämma. */
function verifyTask(task: Task, level: Level) {
  const x = task.answer.n / task.answer.d;
  if (task.level !== level) fail(`fel nivå på ${describe(task)}`);
  if (!Number.isInteger(task.answer.n) || task.answer.d !== 1) fail(`svaret är inte ett heltal: ${describe(task)}`);
  if (level <= 5 && task.answer.n <= 0) fail(`negativt svar på låg nivå: ${describe(task)}`);
  if (Math.abs(task.answer.n) > 200) fail(`orimligt stort svar: ${describe(task)}`);

  let lhs: number;
  let rhs: number;
  try {
    [lhs, rhs] = bothSides(task.equationText, x);
  } catch (error) {
    fail(`kunde inte tolka ${task.equationText}: ${String(error)}`);
    return;
  }
  if (Math.abs(lhs - rhs) > 1e-9) fail(`svaret löser inte ekvationen: ${describe(task)} (${lhs} ≠ ${rhs})`);

  if (task.acceptNegative) {
    const [l2, r2] = bothSides(task.equationText, -x);
    if (Math.abs(l2 - r2) > 1e-9) fail(`negativ rot stämmer inte: ${describe(task)}`);
  }

  const last = task.steps.length - 1;
  if (last < 0) fail(`uppgiften saknar steg: ${describe(task)}`);
  if (!lineText(task, last).includes(task.answerText)) fail(`sista steget visar inte svaret: ${describe(task)}`);
  if (!task.hint || task.hint.length < 10) fail(`ledtråd saknas: ${describe(task)}`);

  const frac = /^(\d*)x\/(\d+) = /.exec(task.equationText);
  if (frac) {
    const a = frac[1] ? Number(frac[1]) : 1;
    const b = Number(frac[2]);
    const g = (p: number, q: number): number => (q ? g(q, p % q) : p);
    if (g(a, b) !== 1) fail(`bråket är inte förkortat: ${describe(task)}`);
    if (a % b === 0) fail(`bråket går jämnt upp: ${describe(task)}`);
  }

  for (let i = 0; i < task.steps.length; i += 1) {
    const text = lineText(task, i);
    if (!text || text.includes("√")) continue;
    try {
      const [a, b] = bothSides(text, x);
      if (Math.abs(a - b) > 1e-9) fail(`steget stämmer inte: ${describe(task)} – "${text}" (${a} ≠ ${b})`);
    } catch (error) {
      fail(`kunde inte tolka steget "${text}" i ${describe(task)}: ${String(error)}`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* 1. Genererade uppgifter                                             */
/* ------------------------------------------------------------------ */

const examples: string[] = [];

for (const level of LEVELS) {
  const rand = mulberry32(1000 + level);
  const seen = new Set<string>();
  for (let i = 0; i < PER_LEVEL; i += 1) {
    const task = generateTask(level, rand);
    verifyTask(task, level);
    seen.add(task.equationText);
    if (i === 0) examples.push(`Nivå ${level}: ${describe(task)} · ${task.steps.length} steg`);
  }
  if (seen.size < 20) fail(`nivå ${level} varierar för lite (${seen.size} olika ekvationer)`);
  console.log(`Nivå ${level}: ${PER_LEVEL} uppgifter kontrollerade, ${seen.size} olika ekvationer`);
}

/* ------------------------------------------------------------------ */
/* 2. Rättning av elevsvar                                             */
/* ------------------------------------------------------------------ */

const accepted = ["4", " 4 ", "4,0", "8/2", "x = 4", "+4", "4.0"];
for (const raw of accepted) {
  if (!parseAnswer(raw) || !sameValue(parseAnswer(raw)!, { n: 4, d: 1 })) fail(`borde godkännas som 4: "${raw}"`);
}
const rejected = ["", "   ", "hej", "4/0", "x", "1/", "/2"];
for (const raw of rejected) {
  if (parseAnswer(raw) !== null) fail(`borde inte tolkas som ett tal: "${raw}"`);
}
if (!sameValue(parseAnswer("12/3")!, { n: 4, d: 1 })) fail("12/3 ska bli 4");
if (!sameValue(parseAnswer("\u22124")!, { n: -4, d: 1 })) fail("−4 ska bli −4");

const square = generateTask(6, () => 0.1);
if (!square.acceptNegative) fail("kvadratrotsekipagen ska acceptera negativ rot");
if (!checkAnswer(square, "−" + square.answerText).ok) fail("negativ rot ska godkännas när den är korrekt");
if (checkAnswer(square, String(square.answer.n + 1)).ok) fail("fel svar ska inte godkännas");

const wrongLevel = generateTask(3, mulberry32(7));
if (checkAnswer(wrongLevel, String(wrongLevel.answer.n)).ok !== true) fail("rätt svar ska godkännas");
if (checkAnswer(wrongLevel, String(wrongLevel.answer.n + 3)).ok !== false) fail("fel svar ska underkännas");

/* ------------------------------------------------------------------ */
/* 3. Statistik                                                        */
/* ------------------------------------------------------------------ */

let stats = emptyStats();
stats = recordAnswer(stats, 1, true, 1);
stats = recordAnswer(stats, 1, true, 2);
stats = recordAnswer(stats, 1, false, 0);
const s1 = stats.levels[1];
if (s1.correct !== 2 || s1.attempts !== 3 || s1.bestStreak !== 2) {
  fail(`statistiken är fel: ${JSON.stringify(s1)}`);
}

/* ------------------------------------------------------------------ */
/* Resultat                                                            */
/* ------------------------------------------------------------------ */

console.log("\nExempel:");
for (const row of examples) console.log("  " + row);

const total = LEVELS.length * PER_LEVEL;
if (failures > 0) {
  console.error(`\n${failures} fel hittades bland ${total} uppgifter.`);
  process.exit(1);
}
console.log(`\nOK: ${total} uppgifter, alla svar och steg stämmer. Rättning och statistik fungerar.`);