import React from 'react';
import { ArrowRightIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, CircleStackIcon } from '@heroicons/react/24/outline';
import type { RepositoryProviderDefinition } from '../../../../../types/repository';
import { SettingsSectionCard, SettingsStatusBadge, SettingsSurfaceCard, settingsButtonClassName } from '../../../../ui/configuration/ConfigurationPrimitives';

interface RepositoryProviderCardProps {
  provider: RepositoryProviderDefinition;
  isActive?: boolean;
  isConfigured?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onActivate?: () => void;
  children?: React.ReactNode;
}

const statusLabel: Record<RepositoryProviderDefinition['status'], string> = {
  available: 'Operativo',
  planned: 'Planificado',
  todo: 'Backlog',
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
      eyebrow="Provider"
      title={provider.name}
      description={provider.description}
      tone="subtle"
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
              className={`w-full gap-2 sm:w-auto ${settingsButtonClassName}`}
            >
              Usar este provider
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          ) : null}
          {onToggleExpand ? (
            <button
              type="button"
              onClick={onToggleExpand}
              className={`w-full gap-2 sm:w-auto ${settingsButtonClassName}`}
            >
              {expanded ? 'Ocultar configuracion' : 'Configurar'}
              {expanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            </button>
          ) : null}
        </>
      )}
    >
      <SettingsSurfaceCard className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
          <CircleStackIcon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">Scope y autenticacion</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{provider.helperText}</p>
        </div>
      </SettingsSurfaceCard>

      {expanded ? (
        <div className="mt-6 border-t border-slate-100 pt-6">
          {children}
        </div>
      ) : null}
    </SettingsSectionCard>
  );
};

export default RepositoryProviderCard;
