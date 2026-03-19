import React from 'react';
import { CircleStackIcon, CpuChipIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { countAvailableRepositoryProviders } from '../../../repository-source/providers.public';

export function SettingsHero({
  isConnectionReady,
  isCodexReady,
}: {
  isConnectionReady: boolean;
  isCodexReady: boolean;
}) {
  const availableProviders = countAvailableRepositoryProviders();
  const configuredIntegrations = Number(isConnectionReady) + Number(isCodexReady);

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))] p-6 shadow-[0_20px_70px_-45px_rgba(15,23,42,0.35)] sm:p-8">
      <div className="grid gap-6 lg:gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.95fr)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Settings</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Configuracion simple del workspace</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">
            Esta vista deja solo el estado general y los accesos importantes. El detalle de providers, Codex y politicas vive en modales para mantener la pantalla principal liviana.
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
    <article className="rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-sky-700">
        {icon}
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </article>
  );
}
