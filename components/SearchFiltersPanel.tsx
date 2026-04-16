"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

export type SearchFilterOption = { id: number; name: string; slug?: string | null };

const Pill = ({ label }: { label: string }) => (
  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
    {label}
  </span>
);

const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false,
  actions,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  actions?: ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</span>
        <div className="flex items-center gap-2">
          {actions}
          {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </div>
      </button>
      {open ? <div className="border-t border-slate-200 dark:border-slate-800" /> : null}
      {open ? <div className="p-4">{children}</div> : null}
    </div>
  );
};

const CheckboxList = ({
  options,
  value,
  onChange,
  emptyLabel,
}: {
  options: SearchFilterOption[];
  value: number[];
  onChange: (next: number[]) => void;
  emptyLabel: string;
}) => {
  const selection = useMemo(() => new Set(value), [value]);

  const toggle = (id: number) => {
    const next = new Set(selection);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(Array.from(next));
  };

  if (!options.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{emptyLabel}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((option) => (
        <label
          key={option.id}
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-800 shadow-sm transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 dark:border-slate-600"
            checked={selection.has(option.id)}
            onChange={() => toggle(option.id)}
          />
          <span className="truncate">{option.name}</span>
        </label>
      ))}
    </div>
  );
};

type MultiSelectProps = {
  options: SearchFilterOption[];
  value: number[];
  onChange: (next: number[]) => void;
  defaultOpen?: boolean;
};

export const GenreFilter = ({ options, value, onChange, defaultOpen }: MultiSelectProps) => (
  <CollapsibleSection
    title="Genres"
    defaultOpen={defaultOpen}
    actions={value.length ? <Pill label={`${value.length} selected`} /> : null}
  >
    <CheckboxList options={options} value={value} onChange={onChange} emptyLabel="No genres found." />
  </CollapsibleSection>
);

export const ThemeFilter = ({ options, value, onChange, defaultOpen }: MultiSelectProps) => (
  <CollapsibleSection
    title="Themes"
    defaultOpen={defaultOpen}
    actions={value.length ? <Pill label={`${value.length} selected`} /> : null}
  >
    <CheckboxList options={options} value={value} onChange={onChange} emptyLabel="No themes found." />
  </CollapsibleSection>
);

export const GameModeFilter = ({ options, value, onChange, defaultOpen }: MultiSelectProps) => (
  <CollapsibleSection
    title="Game modes"
    defaultOpen={defaultOpen}
    actions={value.length ? <Pill label={`${value.length} selected`} /> : null}
  >
    <CheckboxList options={options} value={value} onChange={onChange} emptyLabel="No game modes found." />
  </CollapsibleSection>
);

export const PerspectiveFilter = ({ options, value, onChange, defaultOpen }: MultiSelectProps) => (
  <CollapsibleSection
    title="Player perspectives"
    defaultOpen={defaultOpen}
    actions={value.length ? <Pill label={`${value.length} selected`} /> : null}
  >
    <CheckboxList options={options} value={value} onChange={onChange} emptyLabel="No perspectives found." />
  </CollapsibleSection>
);

type AgeRatingOption = { rating: number; label: string; category?: number | null };

export const AgeRatingFilter = ({
  options,
  value,
  onChange,
  defaultOpen,
}: {
  options: AgeRatingOption[];
  value: number[];
  onChange: (next: number[]) => void;
  defaultOpen?: boolean;
}) => {
  const selection = useMemo(() => new Set(value), [value]);
  const toggle = (rating: number) => {
    const next = new Set(selection);
    if (next.has(rating)) {
      next.delete(rating);
    } else {
      next.add(rating);
    }
    onChange(Array.from(next));
  };

  const pillLabel = value.length ? `${value.length} selected` : null;

  return (
    <CollapsibleSection title="Age ratings" defaultOpen={defaultOpen} actions={pillLabel ? <Pill label={pillLabel} /> : null}>
      {options.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No ratings available.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {options.map((option) => (
            <label
              key={option.rating}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-800 shadow-sm transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 dark:border-slate-600"
                checked={selection.has(option.rating)}
                onChange={() => toggle(option.rating)}
              />
              <span className="truncate">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </CollapsibleSection>
  );
};

export const YearRangePicker = ({
  value,
  onChange,
  minYear,
  maxYear,
  defaultOpen,
}: {
  value: [number, number];
  onChange: (next: [number, number]) => void;
  minYear: number;
  maxYear: number;
  defaultOpen?: boolean;
}) => {
  const [start, end] = value;
  const clampedStart = Math.max(minYear, Math.min(start, end));
  const clampedEnd = Math.min(maxYear, Math.max(start, end));

  const handleChange = (nextStart: number, nextEnd: number) => {
    const normalized: [number, number] = [Math.min(nextStart, nextEnd), Math.max(nextStart, nextEnd)];
    onChange(normalized);
  };

  return (
    <CollapsibleSection
      title="Release year"
      defaultOpen={defaultOpen}
      actions={<Pill label={`${clampedStart}–${clampedEnd}`} />}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">From</span>
            <input
              type="number"
              value={clampedStart}
              min={minYear}
              max={clampedEnd}
              onChange={(event) => handleChange(Number(event.target.value), clampedEnd)}
              className="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">To</span>
            <input
              type="number"
              value={clampedEnd}
              min={clampedStart}
              max={maxYear}
              onChange={(event) => handleChange(clampedStart, Number(event.target.value))}
              className="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
          </label>
        </div>
        <div className="space-y-2">
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={clampedStart}
            onChange={(event) => handleChange(Number(event.target.value), clampedEnd)}
            className="w-full accent-emerald-500"
          />
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={clampedEnd}
            onChange={(event) => handleChange(clampedStart, Number(event.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>
      </div>
    </CollapsibleSection>
  );
};

export const FiltersResetButton = ({ onReset }: { onReset: () => void }) => (
  <button
    type="button"
    onClick={onReset}
    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-200 dark:hover:text-emerald-200"
  >
    <RotateCcw className="h-4 w-4" /> Reset filters
  </button>
);
