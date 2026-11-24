import { useEffect, useRef, useState } from "react";
import Keypad from "./Keypad";
import MathLine from "./MathLine";
import { checkAnswer, LEVEL_META, type Task } from "../lib/equations";
import { report } from "../lib/skolappar";

type Phase = "input" | "correct" | "wrong";

type Props = {
  task: Task;
  index: number;
  total: number;
  streak: number;
  correctCount: number;
  marks: (boolean | null)[];
  onAttempt: (correct: boolean) => void;
  onNext: () => void;
  onQuit: () => void;
};

const MINUS = "\u2212";

export default function Practice({
  task,
  index,
  total,
  streak,
  correctCount,
  marks,
  onAttempt,
  onNext,
  onQuit,
}: Props) {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [hintOpen, setHintOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const goNext = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    onNext();
  };

  const submit = () => {
    if (phase === "correct") return;
    const value = input.trim();
    if (!value) {
      inputRef.current?.focus();
      return;
    }
    const check = checkAnswer(task, value);
    onAttempt(check.ok);
    if (check.ok) {
      setPhase("correct");
      timer.current = window.setTimeout(() => {
        timer.current = null;
        onNext();
      }, 1500);
    } else {
      setPhase("wrong");
      report("hint");
    }
  };

  const press = (key: string) => {
    if (phase === "correct") return;
    setInput((v) => (v.length >= 10 ? v : v + key));
    inputRef.current?.focus();
  };

  const remove = () => {
    if (phase === "correct") return;
    setInput((v) => v.slice(0, -1));
    inputRef.current?.focus();
  };

  const retry = () => {
    setPhase("input");
    setInput("");
    inputRef.current?.focus();
  };

  const border =
    phase === "correct"
      ? "border-[#7cb894] bg-[#f4faf6]"
      : phase === "wrong"
        ? "border-[#d9a29a] bg-[#fdf4f2]"
        : "border-line bg-white focus-within:border-brand";

  const chars = Math.max(2, Math.min(7, input.length + 1));

  return (
    <div className="mx-auto flex w-full max-w-[620px] flex-col px-4 pb-2 pt-3">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <button type="button" className="btn-quiet -ml-2" onClick={onQuit} aria-label="Avbryt och gå till nivåvalet">
          <span aria-hidden className="text-[20px] leading-none">
            ‹
          </span>
          Tillbaka
        </button>
        <div className="text-center">
          <p className="text-[13px] font-semibold leading-tight">
            Nivå {task.level} · {LEVEL_META[task.level].name}
          </p>
          <p className="text-[12px] text-muted">
            Uppgift {index + 1} av {total}
          </p>
        </div>
        <div className="min-w-[58px] text-right">
          <p className="text-[13px] font-semibold leading-tight">{correctCount} rätt</p>
          <p className="text-[12px] text-muted">svit {streak}</p>
        </div>
      </div>

      <div className="mt-2.5 flex gap-1" aria-hidden>
        {marks.map((mark, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              mark === true ? "bg-brand" : mark === false ? "bg-[#d6cbbc]" : i === index ? "bg-[#bfd0f6]" : "bg-[#ece6db]"
            }`}
          />
        ))}
      </div>

      <section className="card mt-3 px-4 py-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Lös ekvationen</p>
        <div className="mt-2 flex min-h-[58px] items-center justify-center">
          <MathLine
            parts={task.equation}
            label={`Ekvation: ${task.equationText}`}
            className="font-semibold leading-tight"
          />
        </div>
      </section>

      <div className={`mt-2.5 flex items-center justify-center gap-2 rounded-[18px] border-2 px-4 py-1.5 transition-colors ${border}`}>
        <span className="text-[24px] font-semibold text-muted" aria-hidden>
          x =
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^0-9x\/\u2212\-.,]/gi, "").slice(0, 10))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          readOnly={phase === "correct"}
          inputMode="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          aria-label="Ditt svar"
          placeholder="?"
          className="min-w-0 bg-transparent text-center text-[28px] font-semibold tracking-wide text-ink outline-none placeholder:text-[#c3bcb0]"
          style={{ width: `${chars}ch` }}
        />
      </div>

      {hintOpen && phase === "input" && (
        <div className="mt-2.5 rounded-[16px] border border-line bg-[#f6f1e7] px-3.5 py-2.5">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Ledtråd</p>
          <p className="mt-0.5 text-[14px] leading-snug">{task.hint}</p>
        </div>
      )}

      {phase === "wrong" && !stepsOpen && (
        <div className="mt-2.5 rounded-[16px] border border-[#eccfc9] bg-[#fdf1ef] px-3.5 py-2.5">
          <p className="text-[15px] font-semibold text-bad">Inte riktigt.</p>
          <p className="mt-0.5 text-[13.5px] leading-snug text-[#7a3b33]">
            {task.acceptNegative
              ? "Tänk på att ett negativt tal också kan bli positivt när det multipliceras med sig självt."
              : "Jämför med stegen – eller försök en gång till."}
          </p>
        </div>
      )}

      {phase === "correct" && (
        <div className="mt-2.5 rounded-[16px] border border-[#c4dfcd] bg-[#f1f9f3] px-3.5 py-2.5" role="status">
          <p className="text-[15px] font-semibold text-good">Rätt! x = {task.answerText}</p>
          <p className="mt-0.5 text-[13.5px] leading-snug text-[#3c6350]">Nästa uppgift kommer om en liten stund.</p>
        </div>
      )}

      {stepsOpen && (
        <div className="card mt-2.5 px-4 py-3.5" role="region" aria-label="Lösning steg för steg">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-muted">Steg för steg</p>
            <p className="text-[13px] font-semibold text-brand">x = {task.answerText}</p>
          </div>
          <ol className="mt-2 space-y-2.5">
            {task.steps.map((step, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eef3fd] text-[11px] font-bold text-brand">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] leading-snug text-muted">{step.instruction}</p>
                  {step.line && (
                    <p className="mt-0.5 text-[19px] font-semibold leading-snug">
                      <MathLine parts={step.line} />
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {task.note && <p className="mt-2 rounded-[12px] bg-[#f6f1e7] px-3 py-2 text-[12.5px] leading-snug text-muted">{task.note}</p>}
        </div>
      )}

      <div className="mt-2.5 flex gap-2">
        {phase === "input" && (
          <>
            <button type="button" className="btn-ghost flex-1" onClick={() => {
                if (!hintOpen) report("hint");
                setHintOpen((v) => !v);
              }}>
              {hintOpen ? "Göm ledtråd" : "Ledtråd"}
            </button>
            <button type="button" className="btn-primary flex-[1.4]" onClick={submit} disabled={!input.trim()}>
              Svara
            </button>
          </>
        )}
        {phase === "wrong" && !stepsOpen && (
          <>
            <button type="button" className="btn-ghost flex-1" onClick={retry}>
              Försök igen
            </button>
            <button type="button" className="btn-primary flex-[1.4]" onClick={() => setStepsOpen(true)}>
              Visa steg
            </button>
          </>
        )}
        {(phase === "correct" || stepsOpen) && (
          <button type="button" className="btn-primary flex-1" onClick={goNext}>
            {index + 1 >= total ? "Visa resultat" : "Nästa uppgift"}
          </button>
        )}
      </div>

      {!stepsOpen && (
        <div className="mt-2.5">
          <Keypad onKey={press} onDelete={remove} onSubmit={submit} disabled={phase === "correct"} />
        </div>
      )}
    </div>
  );
}