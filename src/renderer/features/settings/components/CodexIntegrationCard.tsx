import React from 'react';
import { CheckCircleIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import type { CodexIntegrationConfig } from '../../dashboard/types';
import {
  SettingsField,
  SettingsSectionCard,
  SettingsSelectField,
  SettingsStatTile,
  SettingsStatusBadge,
  SettingsToggleCard,
} from './SettingsPrimitives';

interface CodexIntegrationCardProps {
  config: CodexIntegrationConfig;
  isReady: boolean;
  onChange: <K extends keyof CodexIntegrationConfig>(key: K, value: CodexIntegrationConfig[K]) => void;
}

const CodexIntegrationCard = ({ config, isReady, onChange }: CodexIntegrationCardProps) => (
  <SettingsSectionCard
    eyebrow="AI Integration"
    title="Codex"
    description="Configuracion base para analisis AI sobre una rama exacta. La API key vive solo en sesion y el resto de la politica queda persistida."
    badge={(
      <SettingsStatusBadge
        tone={isReady ? 'emerald' : 'amber'}
        label={isReady ? 'Listo para usar' : 'Pendiente de API key'}
        icon={isReady ? <CheckCircleIcon className="h-4 w-4" /> : undefined}
      />
    )}
    actions={(
      <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
        <CpuChipIcon className="h-6 w-6" />
      </div>
    )}
  >
    <div className="grid gap-4 md:grid-cols-3">
      <SettingsStatTile
        label="Modelo"
        value={config.model}
        description="Modelo activo para el analisis de repositorios."
      />
      <SettingsStatTile
        label="Profundidad"
        value={config.analysisDepth === 'deep' ? 'Deep' : 'Standard'}
        description="Nivel de inspeccion que se le exige al motor."
      />
      <SettingsStatTile
        label="Scope"
        value={config.repositoryScope === 'all' ? 'Todos' : 'Seleccionado'}
        description="Cómo se resuelve el alcance por defecto al lanzar un analisis."
      />
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <SettingsToggleCard
        title="Habilitar integracion"
        description="Permite ejecutar analisis AI cuando implementemos la feature de repositorio/rama."
        checked={config.enabled}
        onChange={(checked) => onChange('enabled', checked)}
      />

      <SettingsSelectField
        label="Modelo"
        value={config.model}
        onChange={(value) => onChange('model', value)}
        options={[
          { value: 'gpt-5.2-codex', label: 'gpt-5.2-codex' },
          { value: 'gpt-5.2', label: 'gpt-5.2' },
          { value: 'gpt-5-codex', label: 'gpt-5-codex' },
        ]}
      />

      <SettingsField
        label="API key"
        type="password"
        value={config.apiKey}
        placeholder="sk-..."
        onChange={(value) => onChange('apiKey', value)}
        hint="Se guarda solo en sesion, no en disco."
      />

      <SettingsSelectField
        label="Profundidad de analisis"
        value={config.analysisDepth}
        onChange={(value) => onChange('analysisDepth', value as CodexIntegrationConfig['analysisDepth'])}
        options={[
          { value: 'standard', label: 'Standard' },
          { value: 'deep', label: 'Deep' },
        ]}
      />

      <SettingsField
        label="Maximo de archivos por corrida"
        type="number"
        value={config.maxFilesPerRun}
        onChange={(value) => onChange('maxFilesPerRun', Number(value) || 0)}
      />

      <SettingsSelectField
        label="Scope por defecto"
        value={config.repositoryScope}
        onChange={(value) => onChange('repositoryScope', value as CodexIntegrationConfig['repositoryScope'])}
        options={[
          { value: 'selected', label: 'Solo repositorio seleccionado' },
          { value: 'all', label: 'Todos los repositorios conectados' },
        ]}
      />

      <SettingsToggleCard
        title="Incluir tests"
        description="Incluye carpetas y archivos de pruebas dentro del contexto del analisis."
        checked={config.includeTests}
        onChange={(checked) => onChange('includeTests', checked)}
      />
    </div>
  </SettingsSectionCard>
);

export default CodexIntegrationCard;
