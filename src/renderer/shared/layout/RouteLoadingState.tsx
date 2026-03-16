import React from 'react';

interface RouteLoadingStateProps {
  pathname: string;
}

const routeLabelMap: Record<string, string> = {
  '/': 'Dashboard',
  '/history': 'Historico',
  '/repository-analysis': 'Repository Analysis',
  '/settings': 'Settings',
};

const RouteLoadingState = ({ pathname }: RouteLoadingStateProps) => (
  <section className="rounded-3xl border border-slate-200 bg-white/90 px-6 py-8 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Cargando vista</p>
    <h1 className="mt-3 text-xl font-semibold text-slate-950">{routeLabelMap[pathname] || 'CheckPR'}</h1>
    <p className="mt-2 text-sm text-slate-500">Preparando la experiencia de esta seccion.</p>
  </section>
);

export default RouteLoadingState;
