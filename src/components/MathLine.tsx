import type { Line } from "../lib/equations";

function Fraction({ n, d }: { n: string; d: string }) {
  return (
    <span className="frac" aria-label={`${n} delat med ${d}`}>
      <span className="frac-num">{n}</span>
      <span className="frac-den">{d}</span>
    </span>
  );
}

type Props = {
  parts: Line;
  className?: string;
  label?: string;
};

/** Renderar en ekvationsrad, med stöd för staplade bråk. */
export default function MathLine({ parts, className = "", label }: Props) {
  return (
    <span className={`math inline-flex flex-wrap items-center justify-center ${className}`} aria-label={label}>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          <span key={i} className="whitespace-pre">
            {part}
          </span>
        ) : (
          <Fraction key={i} n={part.n} d={part.d} />
        )
      )}
    </span>
  );
}