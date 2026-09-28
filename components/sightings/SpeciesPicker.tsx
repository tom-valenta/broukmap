"use client";

import { useEffect, useId, useState } from "react";
import { Check, LoaderCircle, Search, X } from "lucide-react";
import { fieldClass, type Guess } from "@/lib/sightings";

type SpeciesOption = {
  speciesId: string | null;
  taxonId: number | null;
  scientificName: string;
  commonName: string | null;
  family: string | null;
  rank: string;
};

const displayName = (option: Pick<SpeciesOption, "commonName" | "scientificName">) =>
  option.commonName ? `${option.commonName} · ${option.scientificName}` : option.scientificName;

export default function SpeciesPicker({ value, onChange, label = "Tip na druh (nepovinné)", textAllowed = false }: {
  value: Guess;
  onChange: (value: Guess) => void;
  label?: string;
  textAllowed?: boolean;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [options, setOptions] = useState<SpeciesOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState(0);
  const [searched, setSearched] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const query = value.text.trim();
    if (query.length < 2 || value.speciesId) {
      return () => controller.abort();
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/species?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const payload = await response.json() as { results?: SpeciesOption[] };
        if (!controller.signal.aborted) {
          setOptions(payload.results ?? []);
          setActive(0);
          setSearched(query);
          setError("");
        }
      } catch (caught) {
        if (!controller.signal.aborted && !(caught instanceof DOMException && caught.name === "AbortError")) {
          setOptions([]);
          setSearched(query);
          setError("Katalog teď neodpovídá.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [value.text, value.speciesId]);

  async function select(option: SpeciesOption) {
    setError("");
    setSaving(true);
    try {
      let speciesId = option.speciesId;
      let chosen = option;
      if (!speciesId) {
        const response = await fetch("/api/species", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taxonId: option.taxonId }),
        });
        if (!response.ok) throw new Error();
        const saved = await response.json() as SpeciesOption;
        speciesId = saved.speciesId;
        chosen = { ...option, ...saved };
      }
      if (!speciesId) throw new Error();
      setLoading(false);
      onChange({ speciesId, text: displayName(chosen) });
      setOptions([]);
    } catch {
      setError("Druh se nepodařilo vybrat. Zkus to znovu.");
    } finally {
      setSaving(false);
    }
  }

  const query = value.text.trim();
  const waiting = !value.speciesId && query.length >= 2 && searched !== query;

  return <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium">{label}</label>
    <div className="relative">
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
      <input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={options.length > 0}
        aria-activedescendant={options.length ? `${id}-option-${active}` : undefined}
        autoComplete="off"
        className={`${fieldClass} pl-9 pr-10`}
        value={value.text}
        disabled={saving}
        onChange={event => {
          const text = event.target.value;
          if (text.trim().length < 2) { setOptions([]); setLoading(false); }
          onChange({ speciesId: null, text });
        }}
        onKeyDown={event => {
          if (!options.length) return;
          if (event.key === "ArrowDown") { event.preventDefault(); setActive(index => (index + 1) % options.length); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActive(index => (index - 1 + options.length) % options.length); }
          if (event.key === "Enter") { event.preventDefault(); void select(options[active]); }
          if (event.key === "Escape") setOptions([]);
        }}
        placeholder="Hledej česky nebo latinsky"
      />
      {(waiting || loading || saving) && <LoaderCircle aria-label="Načítám" className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin" />}
      {value.speciesId && !saving && <button type="button" aria-label="Zrušit výběr druhu" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full hover:bg-[var(--surface-hover)]" onClick={() => { setOptions([]); setLoading(false); onChange({ speciesId: null, text: "" }); }}><X className="size-4" /></button>}
    </div>
    {value.speciesId
      ? <p className="flex items-center gap-1 text-sm text-[var(--accent)]"><Check className="size-4" />Druh vybrán z katalogu.</p>
      : <p className="text-xs text-[var(--foreground-muted)]">{textAllowed ? "Vyber druh z nabídky; vlastní text se nepočítá jako katalogový druh." : "Napiš aspoň 2 znaky a vyber druh z nabídky."}</p>}
    {!!options.length && <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
      {options.map((option, index) => <li key={`${option.speciesId ?? option.taxonId}-${option.scientificName}`} id={`${id}-option-${index}`} role="option" aria-selected={active === index}>
        <button type="button" className={`min-h-12 w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-hover)] ${active === index ? "bg-[var(--surface-muted)]" : ""}`} onMouseEnter={() => setActive(index)} onClick={() => void select(option)}>
          <span className="block font-medium">{option.commonName || option.scientificName}</span>
          <span className="block text-xs text-[var(--foreground-muted)]"><em>{option.scientificName}</em>{option.family ? ` · ${option.family}` : ""}</span>
        </button>
      </li>)}
    </ul>}
    {!waiting && !loading && query.length >= 2 && !value.speciesId && !options.length && !error && <p className="text-sm text-[var(--foreground-muted)]">Nic nenalezeno. Zkus český nebo latinský název.</p>}
    {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
  </div>;
}
