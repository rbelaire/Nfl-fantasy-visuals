"use client";

export function PosTabs<T extends string>({ options, value, onChange, label }: { options: readonly T[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)}
          className={`stat rounded-md border px-3.5 py-1.5 font-semibold ${value === o ? "border-gold bg-gold text-field" : "border-rule text-mute hover:text-chalk"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
