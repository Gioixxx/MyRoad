"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { countries } from "@/data/countries";
import { countryLabel } from "@/data/country-labels";
import { cn } from "@/lib/utils";
import { CountryFlag } from "./CountryFlag";

interface NationalitySelectProps {
  value: string | null;
  onChange: (countryName: string) => void;
  id?: string;
  /** Stile del campo chiuso: sostituisce quello incassato di default (`input-recessed`). */
  className?: string;
}

export function NationalitySelect({ value, onChange, id, className }: NationalitySelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = countries.find((c) => c.name === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) => countryLabel(c.name).toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    );
  }, [query]);

  // Chiudere azzera anche la ricerca: altrimenti alla riapertura la lista resta filtrata.
  function close() {
    setOpen(false);
    setQuery("");
  }

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(e) => e.key === "Escape" && close()}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between",
          className ?? "input-recessed rounded-md px-3 py-2 text-sm",
        )}
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <CountryFlag
              code={selected.code}
              name={selected.name}
              fallbackEmoji={selected.flag}
              size={18}
            />
            {countryLabel(selected.name)}
          </span>
        ) : (
          <span className="text-(--color-text-muted)">Cerca un paese…</span>
        )}
        <span aria-hidden="true" className="text-(--color-text-muted)">
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md chalk-panel shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && close()}
            placeholder="Cerca…"
            aria-label="Cerca nazionalità"
            className="input-recessed w-full rounded-none border-0 border-b border-(--color-border) px-3 py-2 text-sm outline-none"
          />
          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-(--color-text-muted)">Nessun risultato.</li>
            ) : (
              filtered.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.name === value}
                    onClick={() => {
                      onChange(c.name);
                      close();
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-(--color-surface-raised)",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-glow)",
                      c.name === value && "bg-(--color-surface-raised) font-semibold",
                    )}
                  >
                    <CountryFlag code={c.code} name={c.name} fallbackEmoji={c.flag} size={18} />
                    {countryLabel(c.name)}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
