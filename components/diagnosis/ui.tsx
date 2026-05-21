"use client";

import React from "react";

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {children}
    </label>
  );
}

export function HelpText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{children}</p>
  );
}

export function Intent({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-blue-700 bg-blue-50 border-l-2 border-blue-300 rounded-r px-2.5 py-1.5 mt-1 mb-2 leading-relaxed">
      {children}
    </p>
  );
}

export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-lg text-sm border transition-all whitespace-nowrap ${
            value === opt.value
              ? "bg-blue-900 text-white border-blue-900 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function CheckboxGroup<T extends string>({
  values,
  onChange,
  options,
}: {
  values: T[];
  onChange: (values: T[]) => void;
  options: { value: T; label: string }[];
}) {
  function toggle(v: T) {
    if (values.includes(v)) {
      onChange(values.filter((x) => x !== v));
    } else {
      onChange([...values, v]);
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={`px-4 py-2 rounded-lg text-sm border transition-all whitespace-nowrap ${
            values.includes(opt.value)
              ? "bg-blue-900 text-white border-blue-900 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-4 space-y-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function FieldBlock({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}
