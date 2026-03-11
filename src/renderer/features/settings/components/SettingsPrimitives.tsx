import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

type BadgeTone = 'sky' | 'emerald' | 'amber' | 'slate' | 'rose';

const badgeToneClassName: Record<BadgeTone, string> = {
  sky: 'border-sky-200 bg-sky-50 text-sky-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  slate: 'border-slate-200 bg-slate-100 text-slate-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
};

interface SettingsSectionCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const SettingsSectionCard = ({
  eyebrow,
  title,
  description,
  badge,
  actions,
  children,
  className = '',
}: SettingsSectionCardProps) => (
  <section className={`rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-[0_20px_70px_-45px_rgba(15,23,42,0.45)] backdrop-blur ${className}`}>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-600">{eyebrow}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
          {badge}
        </div>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>

    {children ? <div className="mt-6">{children}</div> : null}
  </section>
);

interface SettingsStatusBadgeProps {
  tone: BadgeTone;
  label: string;
  icon?: React.ReactNode;
}

export const SettingsStatusBadge = ({ tone, label, icon }: SettingsStatusBadgeProps) => (
  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${badgeToneClassName[tone]}`}>
    {icon}
    {label}
  </span>
);

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
  <label className={`space-y-2 text-sm text-slate-600 ${span}`}>
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
  <label className={`space-y-2 text-sm text-slate-600 ${span}`}>
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
  <label className={`space-y-2 text-sm text-slate-600 ${span}`}>
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

interface SettingsToggleCardProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const SettingsToggleCard = ({
  title,
  description,
  checked,
  onChange,
}: SettingsToggleCardProps) => (
  <label className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
    <div className="pr-3">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative mt-1 inline-flex h-7 w-12 rounded-full transition ${checked ? 'bg-sky-600' : 'bg-slate-300'}`}
    >
      <span
        className={`inline-block h-5 w-5 translate-y-1 rounded-full bg-white shadow transition ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  </label>
);

interface SettingsStatTileProps {
  label: string;
  value: string;
  description: string;
}

export const SettingsStatTile = ({ label, value, description }: SettingsStatTileProps) => (
  <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
    <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
  </article>
);

interface SettingsNoticeProps {
  tone: 'warning' | 'error' | 'success';
  children: React.ReactNode;
}

export const SettingsNotice = ({ tone, children }: SettingsNoticeProps) => {
  const toneConfig = {
    warning: {
      className: 'border-amber-200 bg-amber-50 text-amber-800',
      icon: <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />,
    },
    error: {
      className: 'border-rose-200 bg-rose-50 text-rose-700',
      icon: <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />,
    },
    success: {
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      icon: <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />,
    },
  } as const;

  return (
    <div className={`flex gap-3 rounded-2xl border px-4 py-3 text-sm ${toneConfig[tone].className}`}>
      {toneConfig[tone].icon}
      <div className="min-w-0 leading-6">{children}</div>
    </div>
  );
};
