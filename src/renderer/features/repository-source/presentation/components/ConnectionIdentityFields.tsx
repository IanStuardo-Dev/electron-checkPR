import React from 'react';
import {
  SettingsField,
} from '../../../../ui/configuration/ConfigurationPrimitives';
import type { SavedConnectionConfig } from '../../types';

interface ConnectionIdentityFieldsProps {
  organizationLabel: string;
  tokenLabel: string;
  organizationPlaceholder: string;
  tokenPlaceholder: string;
  config: SavedConnectionConfig;
  projectsLoading: boolean;
  loadLabel: string;
  onConfigChange: (name: keyof SavedConnectionConfig, value: string) => void;
  onDiscoverProjects: () => void;
}

export function ConnectionIdentityFields({
  organizationLabel,
  tokenLabel,
  organizationPlaceholder,
  tokenPlaceholder,
  config,
  projectsLoading,
  loadLabel,
  onConfigChange,
  onDiscoverProjects,
}: ConnectionIdentityFieldsProps) {
  return (
    <>
      <SettingsField
        label={organizationLabel}
        value={config.organization}
        placeholder={organizationPlaceholder}
        onChange={(value) => onConfigChange('organization', value)}
      />
      <div className="space-y-3">
        <SettingsField
          label={tokenLabel}
          value={config.personalAccessToken}
          placeholder={tokenPlaceholder}
          type="password"
          onChange={(value) => onConfigChange('personalAccessToken', value)}
        />
        <button
          type="button"
          onClick={onDiscoverProjects}
          disabled={projectsLoading || !config.organization || !config.personalAccessToken}
          className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {projectsLoading ? `${loadLabel}...` : loadLabel}
        </button>
      </div>
    </>
  );
}
