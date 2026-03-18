import React from 'react';
import type { BadgeTone } from './ConfigurationPrimitives.shared';
import { badgeToneClassName, settingsButtonClassName } from './ConfigurationPrimitives.shared';

interface SettingsSectionCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  tone?: 'default' | 'subtle';
}

export const SettingsSectionCard = ({
  eyebrow,
  title,
  description,
  badge,
  actions,
  children,
  className = '',
  tone = 'default',
}: SettingsSectionCardProps) => (
  <section className={`${
    tone === 'subtle'
      ? 'rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-5 shadow-none sm:rounded-[28px] sm:p-6'
      : 'rounded-[24px] border border-slate-200 bg-white/95 p-5 shadow-[0_20px_70px_-45px_rgba(15,23,42,0.45)] backdrop-blur sm:rounded-[28px] sm:p-6'
  } ${className}`}>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-600">{eyebrow}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">{title}</h2>
          {badge}
        </div>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap items-stretch gap-2 sm:w-auto sm:items-center">{actions}</div> : null}
    </div>

    {children ? <div className="mt-6">{children}</div> : null}
  </section>
);

interface SettingsSurfaceCardProps {
  children: React.ReactNode;
  className?: string;
}

export const SettingsSurfaceCard = ({
  children,
  className = '',
}: SettingsSurfaceCardProps) => (
  <article className={`rounded-[24px] border border-slate-200/90 bg-slate-50/70 p-5 ${className}`}>
    {children}
  </article>
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
  <label className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0 pr-0 sm:pr-3">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition sm:mt-1 ${checked ? 'bg-sky-600' : 'bg-slate-300'}`}
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
  className?: string;
}

export const SettingsStatTile = ({ label, value, description, className = '' }: SettingsStatTileProps) => (
  <article className={`min-w-0 rounded-2xl border border-slate-200 bg-white/70 p-4 ${className}`}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
    <p className="mt-3 break-words text-2xl font-semibold text-slate-950">{value}</p>
    <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
  </article>
);

interface SettingsActionCardProps {
  eyebrow: string;
  title: string;
  description: string;
  badge?: React.ReactNode;
  summaryLabel: string;
  summaryValue: string;
  summaryDescription: string;
  actionLabel: string;
  onAction: () => void;
}

export const SettingsActionCard = ({
  eyebrow,
  title,
  description,
  badge,
  summaryLabel,
  summaryValue,
  summaryDescription,
  actionLabel,
  onAction,
}: SettingsActionCardProps) => (
  <SettingsSurfaceCard className="flex h-full flex-col">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-950">{title}</h3>
      </div>
      {badge}
    </div>
    <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-slate-500">{description}</p>
    <div className="mt-4 flex-1">
      <SettingsStatTile
        label={summaryLabel}
        value={summaryValue}
        description={summaryDescription}
        className="h-full"
      />
    </div>
    <button
      type="button"
      onClick={onAction}
      className={`mt-4 w-full ${settingsButtonClassName}`}
    >
      {actionLabel}
    </button>
  </SettingsSurfaceCard>
);
