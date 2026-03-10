import React from 'react';
import { CheckCircleIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import type { CodexIntegrationConfig } from '../../dashboard/types';

interface CodexIntegrationCardProps {
  config: CodexIntegrationConfig;
  isReady: boolean;
  onChange: <K extends keyof CodexIntegrationConfig>(key: K, value: CodexIntegrationConfig[K]) => void;
}

const CodexIntegrationCard = ({ config, isReady, onChange }: CodexIntegrationCardProps) => (
  <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
            <CpuChipIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Codex Integration</h2>
            <p className="text-sm text-slate-500">
              Configuracion base para analisis AI de repositorios sobre ramas exactas.
            </p>
          </div>
        </div>
      </div>
      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
        isReady ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
      }`}>
        {isReady ? <CheckCircleIcon className="h-4 w-4" /> : null}
        {isReady ? 'Listo para usar' : 'Pendiente de API key'}
      </div>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <ToggleRow
        title="Habilitar integracion"
        description="Permite ejecutar analisis AI cuando implementemos la feature de repositorio/rama."
        checked={config.enabled}
        onChange={(checked) => onChange('enabled', checked)}
      />

      <label className="space-y-2 text-sm text-slate-600">
        <span>Modelo</span>
        <select
          value={config.model}
          onChange={(event) => onChange('model', event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white"
        >
          <option value="gpt-5.2-codex">gpt-5.2-codex</option>
          <option value="gpt-5.2">gpt-5.2</option>
          <option value="gpt-5-codex">gpt-5-codex</option>
        </select>
      </label>

      <label className="space-y-2 text-sm text-slate-600">
        <span>API key</span>
        <input
          type="password"
          value={config.apiKey}
          onChange={(event) => onChange('apiKey', event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white"
          placeholder="sk-..."
        />
        <p className="text-xs text-slate-400">Se guarda solo en sesion, no en disco.</p>
      </label>

      <label className="space-y-2 text-sm text-slate-600">
        <span>Profundidad de analisis</span>
        <select
          value={config.analysisDepth}
          onChange={(event) => onChange('analysisDepth', event.target.value as CodexIntegrationConfig['analysisDepth'])}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white"
        >
          <option value="standard">Standard</option>
          <option value="deep">Deep</option>
        </select>
      </label>

      <label className="space-y-2 text-sm text-slate-600">
        <span>Maximo de archivos por corrida</span>
        <input
          type="number"
          min={10}
          max={500}
          value={config.maxFilesPerRun}
          onChange={(event) => onChange('maxFilesPerRun', Number(event.target.value) || 0)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white"
        />
      </label>

      <label className="space-y-2 text-sm text-slate-600">
        <span>Scope por defecto</span>
        <select
          value={config.repositoryScope}
          onChange={(event) => onChange('repositoryScope', event.target.value as CodexIntegrationConfig['repositoryScope'])}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white"
        >
          <option value="selected">Solo repositorio seleccionado</option>
          <option value="all">Todos los repositorios conectados</option>
        </select>
      </label>

      <ToggleRow
        title="Incluir tests"
        description="Incluye carpetas y archivos de pruebas dentro del contexto del analisis."
        checked={config.includeTests}
        onChange={(checked) => onChange('includeTests', checked)}
      />
    </div>
  </section>
);

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleRow = ({ title, description, checked, onChange }: ToggleRowProps) => (
  <label className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
    <div>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
    />
  </label>
);

export default CodexIntegrationCard;
