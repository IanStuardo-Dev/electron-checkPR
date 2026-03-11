import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChartPieIcon, ClockIcon, Cog6ToothIcon, SparklesIcon } from '@heroicons/react/24/outline';

const navClassName = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
    isActive
      ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-100'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }`;

const Sidebar = () => {
  return (
    <aside className="sticky top-0 flex h-screen w-72 flex-col border-r border-slate-200 bg-white/95 px-6 py-8 backdrop-blur">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">CheckPR</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">Repo Command Center</h1>
        <p className="mt-2 text-sm text-slate-500">
          Seguimiento operativo de PRs, reviewers, ramas y repositorios sobre multiples providers.
        </p>
      </div>

      <nav className="mt-10 space-y-2">
        <NavLink to="/" end className={navClassName}>
          <ChartPieIcon className="h-5 w-5" />
          Dashboard
        </NavLink>
        <NavLink to="/history" className={navClassName}>
          <ClockIcon className="h-5 w-5" />
          Historico
        </NavLink>
        <NavLink to="/repository-analysis" className={navClassName}>
          <SparklesIcon className="h-5 w-5" />
          Repo Analysis
        </NavLink>
      </nav>

      <div className="mt-auto space-y-4">
        <NavLink to="/settings" className={navClassName}>
          <Cog6ToothIcon className="h-5 w-5" />
          Settings
        </NavLink>

        <div className="rounded-3xl bg-slate-950 p-5 text-sm text-slate-300">
          <p className="font-medium text-white">Core del producto</p>
          <p className="mt-2">
            Dashboard y Historico quedan para operacion. Settings centraliza Azure, GitHub y GitLab, con Bitbucket en backlog.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
