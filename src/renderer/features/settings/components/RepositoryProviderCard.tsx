import React from 'react';
import { CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, CircleStackIcon } from '@heroicons/react/24/outline';
import type { RepositoryProviderDefinition } from '../../../../types/repository';

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
}: RepositoryProviderCardProps) => (
  <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
          <CircleStackIcon className="h-6 w-6" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900">{provider.name}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[provider.status]}`}>
              {statusLabel[provider.status]}
            </span>
            {isActive ? (
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                Provider activo
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-slate-500">{provider.description}</p>
          <p className="mt-1 text-xs text-slate-400">{provider.helperText}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isConfigured ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <CheckCircleIcon className="h-4 w-4" />
            Configurado
          </span>
        ) : null}
        {!isActive && onActivate ? (
          <button
            type="button"
            onClick={onActivate}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600"
          >
            Usar este provider
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
      </div>
    </div>

    {expanded ? (
      <div className="mt-6 border-t border-slate-100 pt-6">
        {children}
      </div>
    ) : null}
  </section>
);

export default RepositoryProviderCard;
