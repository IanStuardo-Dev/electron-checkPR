import React from 'react';
import { CircleStackIcon, CpuChipIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { repositoryProviders } from '../../repository-source/providers';

export function SettingsHero({
  isConnectionReady,
  isCodexReady,
}: {
  isConnectionReady: boolean;
  isCodexReady: boolean;
}) {
  const availableProviders = repositoryProviders.filter((provider) => provider.status === 'available').length;
  const configuredIntegrations = Number(isConnectionReady) + Number(isCodexReady);

  return (
    <section className="overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.24),_transparent_28%),linear-gradient(135deg,_#020617,_#0f172a_55%,_#111827)] p-6 text-white shadow-[0_35px_100px_-45px_rgba(2,6,23,0.95)] sm:p-8 lg:p-10">
      <div className="grid gap-6 lg:gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Settings</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem]">Configuracion de fuentes e integraciones</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-[15px]">
            Este es el hub para providers de repositorios e integraciones transversales. Azure DevOps, GitHub y GitLab quedan operativos;
            Bitbucket entra al backlog futuro.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
          <HeroMetric
            icon={<CircleStackIcon className="h-5 w-5" />}
            label="Providers operativos"
            value={`${availableProviders}`}
            detail="Azure DevOps, GitHub y GitLab"
          />
          <HeroMetric
            icon={<CpuChipIcon className="h-5 w-5" />}
            label="Integraciones listas"
            value={`${configuredIntegrations}/2`}
            detail="Provider activo + Codex"
          />
          <HeroMetric
            icon={<ShieldCheckIcon className="h-5 w-5" />}
            label="Persistencia segura"
            value="Sesion"
            detail="Secrets fuera de disco"
          />
        </div>
      </div>
    </section>
  );
}

function HeroMetric({ icon, label, value, detail }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-sky-300">
        {icon}
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
    </article>
  );
}
