import React from 'react';
import { SettingsNotice } from '../../../../shared/ui/settings/SettingsPrimitives';

interface ConnectionFeedbackProps {
  providerName: string;
  isConnected: boolean;
  error: string | null;
  projectDiscoveryWarning: string | null;
  hasProjects: boolean;
}

export function ConnectionFeedback({
  providerName,
  isConnected,
  error,
  projectDiscoveryWarning,
  hasProjects,
}: ConnectionFeedbackProps) {
  return (
    <>
      {isConnected ? (
        <div className="mt-5">
          <SettingsNotice tone="success">
            <span className="font-medium">Conectado correctamente.</span> El provider {providerName} esta sincronizado y listo para usarse.
          </SettingsNotice>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {error ? (
          <SettingsNotice tone="error">
            {error}
          </SettingsNotice>
        ) : null}
        {projectDiscoveryWarning && !hasProjects ? (
          <SettingsNotice tone="warning">
            {projectDiscoveryWarning}
          </SettingsNotice>
        ) : null}
      </div>
    </>
  );
}
