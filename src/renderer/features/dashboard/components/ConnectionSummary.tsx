import React from 'react';
import { CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface ConnectionSummaryProps {
  providerKind?: 'azure-devops' | 'github' | 'gitlab' | 'bitbucket';
  providerName: string;
  scopeLabel: string;
  projectName: string | null;
  repositoryName: string | null;
  isConnected?: boolean;
  compact?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  showAction?: boolean;
  actionLabel?: string;
  actionTo?: string;
  empty?: boolean;
}

const ConnectionSummary = ({
  providerKind = 'azure-devops',
  providerName,
  scopeLabel,
  projectName,
  repositoryName,
  isConnected = false,
  compact = false,
  expandable = false,
  expanded = false,
  onToggleExpand,
  showAction = true,
  actionLabel = 'Abrir settings',
  actionTo = '/settings',
  empty = false,
}: ConnectionSummaryProps) => (
  <div className={`rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 ${compact ? 'p-5' : 'p-6'}`}>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">{providerName}</p>
          {isConnected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <CheckCircleIcon className="h-4 w-4" />
              OK conectado
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Pendiente de configuracion
            </span>
          )}
        </div>
        <h2 className={`mt-2 font-semibold text-slate-900 ${compact ? 'text-lg' : 'text-xl'}`}>{scopeLabel}</h2>
        <p className="mt-2 text-sm text-slate-500">
          {empty
            ? 'Selecciona un provider en Settings para definir el alcance del dashboard y del analisis.'
            : providerKind === 'github'
            ? `Repositorio: ${repositoryName || projectName || 'Todos los repositorios del owner'}`
            : providerKind === 'gitlab'
              ? `Proyecto: ${repositoryName || projectName || 'Todos los proyectos del namespace'}`
              : `Proyecto: ${projectName || 'No seleccionado'} · Repositorio: ${repositoryName || 'Todos los repositorios'}`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {expandable && onToggleExpand ? (
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600"
          >
            {expanded ? 'Ocultar configuracion' : 'Expandir'}
            {expanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
          </button>
        ) : null}

        {!compact && showAction ? (
          <Link
            to={actionTo}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600"
          >
            <Cog6ToothIcon className="h-4 w-4" />
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  </div>
);

export default ConnectionSummary;
