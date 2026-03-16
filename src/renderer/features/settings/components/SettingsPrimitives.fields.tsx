import React from 'react';

interface SettingsFieldProps {
  label: string;
  value: string | number;
  placeholder?: string;
  onChange: (value: string) => void;
  type?: 'text' | 'password' | 'number';
  hint?: string;
  disabled?: boolean;
  span?: string;
}

export const SettingsField = ({
  label,
  value,
  placeholder,
  onChange,
  type = 'text',
  hint,
  disabled = false,
  span = '',
}: SettingsFieldProps) => (
  <label className={`min-w-0 space-y-2 text-sm text-slate-600 ${span}`}>
    <span className="font-medium text-slate-700">{label}</span>
    <input
      type={type}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      placeholder={placeholder}
    />
    {hint ? <p className="text-xs leading-5 text-slate-400">{hint}</p> : null}
  </label>
);

interface SettingsTextAreaFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
  span?: string;
}

export const SettingsTextAreaField = ({
  label,
  value,
  placeholder,
  onChange,
  hint,
  rows = 4,
  span = '',
}: SettingsTextAreaFieldProps) => (
  <label className={`min-w-0 space-y-2 text-sm text-slate-600 ${span}`}>
    <span className="font-medium text-slate-700">{label}</span>
    <textarea
      value={value}
      rows={rows}
      onChange={(event) => onChange(event.target.value)}
      className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
      placeholder={placeholder}
    />
    {hint ? <p className="text-xs leading-5 text-slate-400">{hint}</p> : null}
  </label>
);

interface SettingsSelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  hint?: string;
  disabled?: boolean;
  span?: string;
}

export const SettingsSelectField = ({
  label,
  value,
  onChange,
  options,
  hint,
  disabled = false,
  span = '',
}: SettingsSelectFieldProps) => (
  <label className={`min-w-0 space-y-2 text-sm text-slate-600 ${span}`}>
    <span className="font-medium text-slate-700">{label}</span>
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {hint ? <p className="text-xs leading-5 text-slate-400">{hint}</p> : null}
  </label>
);
