import React from 'react';
import { ArrowRightIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, CircleStackIcon } from '@heroicons/react/24/outline';
import type { RepositoryProviderDefinition } from '../../../../types/repository';
import { SettingsSectionCard, SettingsStatusBadge } from './SettingsPrimitives';

interface RepositoryProviderCardProps {
  provider: RepositoryProviderDefinition;
  isActive?: boolean;
  isConfigured?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onActivate?: () => void;
  children?: React.ReactNode;
}

const statusStyles: Record<RepositoryProviderDefinition['status'], string> = {
  available: 'bg-emerald-50 text-emerald-700',
  planned: 'bg-amber-50 text-amber-700',
  todo: 'bg-slate-100 text-slate-600',
};

const statusLabel: Record<RepositoryProviderDefinition['status'], string> = {
  available: 'Operativo',
  planned: 'Planned',
  todo: 'TODO futuro',
};

const RepositoryProviderCard = ({
  provider,
  isActive = false,
  isConfigured = false,
  expanded = false,
  onToggleExpand,
  onActivate,
  children,
}: RepositoryProviderCardProps) => {
  const badgeTone = provider.status === 'available'
    ? 'emerald'
    : provider.status === 'planned'
      ? 'amber'
      : 'slate';

  return (
    <SettingsSectionCard
      eyebrow="Repository Provider"
      title={provider.name}
      description={provider.description}
      badge={<SettingsStatusBadge tone={badgeTone} label={statusLabel[provider.status]} />}
      actions={(
        <>
          {isActive ? (
            <SettingsStatusBadge tone="sky" label="Provider activo" />
          ) : null}
          {isConfigured ? (
            <SettingsStatusBadge
              tone="emerald"
              label="Conectado"
              icon={<CheckCircleIcon className="h-4 w-4" />}
            />
          ) : null}
          {!isActive && onActivate ? (
            <button
              type="button"
              onClick={onActivate}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600"
            >
              Usar este provider
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          ) : null}
          {onToggleExpand ? (
            <button
              type="button"
              onClick={onToggleExpand}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600"
            >
              {expanded ? 'Ocultar configuracion' : 'Configurar'}
              {expanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            </button>
          ) : null}
        </>
      )}
    >
      <div className="flex items-start gap-4 rounded-2xl bg-slate-50/80 p-4">
        <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
          <CircleStackIcon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">Scope y autenticacion</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{provider.helperText}</p>
        </div>
      </div>

      {expanded ? (
        <div className="mt-6 border-t border-slate-100 pt-6">
          {children}
        </div>
      ) : null}
    </SettingsSectionCard>
  );
};

export default RepositoryProviderCard;
