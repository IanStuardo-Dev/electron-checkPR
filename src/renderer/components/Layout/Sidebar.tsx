import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChartPieIcon,
  ClockIcon,
  Cog6ToothIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const primaryNavigation = [
  {
    to: '/',
    label: 'Dashboard',
    description: 'Metricas operativas y foco diario',
    Icon: ChartPieIcon,
  },
  {
    to: '/history',
    label: 'Historico',
    description: 'Seguimiento de actividad y snapshots',
    Icon: ClockIcon,
  },
  {
    to: '/repository-analysis',
    label: 'Repo Analysis',
    description: 'Explora contexto tecnico y hallazgos',
    Icon: SparklesIcon,
  },
] as const;

const secondaryNavigation = [
  {
    to: '/settings',
    label: 'Settings',
    description: 'Integraciones, claves y politicas',
    Icon: Cog6ToothIcon,
  },
] as const;

const navClassName = ({ isActive }: { isActive: boolean }) =>
  `group relative flex min-h-[4.75rem] items-start gap-3 rounded-2xl px-4 py-3.5 transition ${
    isActive
      ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/80'
      : 'text-slate-600 hover:bg-white/70 hover:text-slate-950'
  }`;

const Sidebar = () => {
  return (
    <aside className="flex h-full w-80 shrink-0 p-4 lg:p-5">
      <div className="flex h-full w-full flex-col rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] px-5 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 backdrop-blur">
        <div className="rounded-[1.75rem] border border-sky-100 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-700">CheckPR</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Repo Command Center</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Seguimiento operativo de PRs, reviewers, ramas y repositorios con una navegacion mas clara y enfocada.
          </p>
        </div>

        <div className="mt-8">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
            Navegacion
          </p>
          <nav className="mt-3 space-y-2">
            {primaryNavigation.map(({ to, label, description, Icon }) => (
              <NavLink key={to} to={to} end={to === '/'} className={navClassName}>
                {({ isActive }) => (
                  <>
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
                      isActive
                        ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-100'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-900 group-hover:ring-1 group-hover:ring-slate-200/80'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-semibold">{label}</span>
                        {isActive ? <span className="h-2 w-2 rounded-full bg-sky-500" /> : null}
                      </div>
                      <p className={`mt-1 truncate text-xs ${
                        isActive ? 'text-slate-500' : 'text-slate-500 group-hover:text-slate-600'
                      }`}>
                        {description}
                      </p>
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto pt-8">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
            Configuracion
          </p>
          <div className="mt-3 space-y-2">
            {secondaryNavigation.map(({ to, label, description, Icon }) => (
              <NavLink key={to} to={to} className={navClassName}>
                {({ isActive }) => (
                  <>
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
                      isActive
                        ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-100'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-900 group-hover:ring-1 group-hover:ring-slate-200/80'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{label}</span>
                      <p className={`mt-1 truncate text-xs ${
                        isActive ? 'text-slate-500' : 'text-slate-500 group-hover:text-slate-600'
                      }`}>
                        {description}
                      </p>
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
