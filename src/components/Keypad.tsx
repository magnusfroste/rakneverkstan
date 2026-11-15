const MINUS = "\u2212";

type Props = {
  onKey: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  disabled?: boolean;
};

const DIGITS = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];

/** Eget siffertangentbord som fungerar med fingrar på iPad och mobil. */
export default function Keypad({ onKey, onDelete, onSubmit, disabled = false }: Props) {
  return (
    <div className="mx-auto grid w-full max-w-[400px] grid-cols-4 gap-2" aria-label="Siffertangentbord">
      {DIGITS.slice(0, 3).map((d) => (
        <button key={d} type="button" className="key" onClick={() => onKey(d)} disabled={disabled} aria-label={`Siffran ${d}`}>
          {d}
        </button>
      ))}
      <button type="button" className="key text-[20px]" onClick={onDelete} disabled={disabled} aria-label="Radera sista tecknet">
        ⌫
      </button>

      {DIGITS.slice(3, 6).map((d) => (
        <button key={d} type="button" className="key" onClick={() => onKey(d)} disabled={disabled} aria-label={`Siffran ${d}`}>
          {d}
        </button>
      ))}
      <button type="button" className="key" onClick={() => onKey("x")} disabled={disabled} aria-label="Bokstaven x">
        x
      </button>

      {DIGITS.slice(6, 9).map((d) => (
        <button key={d} type="button" className="key" onClick={() => onKey(d)} disabled={disabled} aria-label={`Siffran ${d}`}>
          {d}
        </button>
      ))}
      <button type="button" className="key" onClick={() => onKey(MINUS)} disabled={disabled} aria-label="Minustecken">
        −
      </button>

      <button type="button" className="key" onClick={() => onKey("0")} disabled={disabled} aria-label="Siffran 0">
        0
      </button>
      <button type="button" className="key" onClick={() => onKey("/")} disabled={disabled} aria-label="Bråkstreck">
        /
      </button>
      <button
        type="button"
        className="key-accent col-span-2 text-[17px]"
        onClick={onSubmit}
        disabled={disabled}
        aria-label="Rätta svaret"
      >
        Klar
      </button>
    </div>
  );
}