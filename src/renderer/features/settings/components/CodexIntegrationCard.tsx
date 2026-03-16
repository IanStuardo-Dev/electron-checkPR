import React from 'react';
import { CheckCircleIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import type { CodexIntegrationConfig } from '../../dashboard/types';
import {
  SettingsSectionCard,
  SettingsStatusBadge,
  settingsButtonClassName,
} from './SettingsPrimitives';
import { CodexIntegrationPoliciesModal } from './CodexIntegrationPoliciesModal';
import { CodexIntegrationSettingsGrid } from './CodexIntegrationSettingsGrid';

interface CodexIntegrationCardProps {
  config: CodexIntegrationConfig;
  isReady: boolean;
  onChange: <K extends keyof CodexIntegrationConfig>(key: K, value: CodexIntegrationConfig[K]) => void;
}

const CodexIntegrationCard = ({ config, isReady, onChange }: CodexIntegrationCardProps) => {
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = React.useState(false);

  return (
    <SettingsSectionCard
      eyebrow="Codex"
      title="Codex"
      description="Configuracion base para analisis AI sobre repositorios y sobre la cola priorizada de PRs. La API key vive solo en sesion y las reglas avanzadas quedan fuera de la vista principal."
      tone="subtle"
      badge={(
        <SettingsStatusBadge
          tone={isReady ? 'emerald' : 'amber'}
          label={isReady ? 'Listo para usar' : 'Pendiente de API key'}
          icon={isReady ? <CheckCircleIcon className="h-4 w-4" /> : undefined}
        />
      )}
      actions={(
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
            <CpuChipIcon className="h-6 w-6" />
          </div>
          <button
            type="button"
            onClick={() => setIsAdvancedModalOpen(true)}
            className={`w-full sm:w-auto ${settingsButtonClassName}`}
          >
            Politicas avanzadas
          </button>
        </div>
      )}
    >
      <CodexIntegrationSettingsGrid config={config} onChange={onChange} />

      <CodexIntegrationPoliciesModal
        config={config}
        isOpen={isAdvancedModalOpen}
        onClose={() => setIsAdvancedModalOpen(false)}
        onChange={onChange}
      />
    </SettingsSectionCard>
  );
};

export default CodexIntegrationCard;
