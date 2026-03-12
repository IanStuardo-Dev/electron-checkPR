import React from 'react';
import type { CodexIntegrationConfig } from '../../dashboard/types';
import {
  SettingsSectionCard,
  SettingsModal,
  SettingsNotice,
  SettingsStatusBadge,
  SettingsTextAreaField,
  SettingsToggleCard,
} from './SettingsPrimitives';

interface GlobalSnapshotPolicyCardProps {
  snapshotPolicy: CodexIntegrationConfig['snapshotPolicy'];
  onChange: (value: CodexIntegrationConfig['snapshotPolicy']) => void;
}

const NODE_SNAPSHOT_PRESET = [
  '.env',
  '.env.*',
  'node_modules/**',
  'dist/**',
  'build/**',
  'coverage/**',
  '*.pem',
  '*.key',
  '*.p12',
  '*.log',
  '.npmrc',
  '.yarnrc*',
  '.pnpm-store/**',
].join('\n');

export function applySnapshotPreset(
  snapshotPolicy: CodexIntegrationConfig['snapshotPolicy'],
  preset: 'node',
): CodexIntegrationConfig['snapshotPolicy'] {
  if (preset === 'node') {
    return {
      ...snapshotPolicy,
      excludedPathPatterns: NODE_SNAPSHOT_PRESET,
    };
  }

  return snapshotPolicy;
}

const GlobalSnapshotPolicyCard = ({ snapshotPolicy, onChange }: GlobalSnapshotPolicyCardProps) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const excludedPatternsCount = snapshotPolicy.excludedPathPatterns
    .split('\n')
    .map((pattern) => pattern.trim())
    .filter(Boolean)
    .length;

  return (
    <SettingsSectionCard
      eyebrow="Global Snapshot Policy"
      title="Reglas globales de snapshot"
      description="Estas exclusiones y el modo estricto aplican a cualquier snapshot del producto: preflight de Repository Analysis, PR AI Review y futuras corridas que reutilicen el pipeline."
      badge={(
        <SettingsStatusBadge
          tone="sky"
          label={`${excludedPatternsCount} patrones activos`}
        />
      )}
      actions={(
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600 sm:w-auto"
        >
          Editar reglas
        </button>
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsToggleCard
          title="Modo estricto global"
          description="Bloquea el envio a Codex si el preflight detecta posibles secretos, archivos sensibles o cobertura insuficiente del snapshot."
          checked={snapshotPolicy.strictMode}
          onChange={(checked) => onChange({
            ...snapshotPolicy,
            strictMode: checked,
          })}
        />

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-600">
          <p className="font-medium text-slate-900">Cobertura global</p>
          <p className="mt-2">
            Las reglas definidas aqui se aplican antes de cualquier preflight y antes de cualquier envio remoto.
            Las exclusiones temporales siguen existiendo, pero se suman a esta base global y no la reemplazan.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600 sm:col-span-2">
          <p className="font-medium text-slate-900">Preset disponible</p>
          <p className="mt-2">
            Por ahora la pantalla incluye un preset recomendado para <span className="font-medium">Node</span>.
            Puedes aplicarlo y luego ajustarlo desde el editor avanzado.
          </p>
        </div>
      </div>

      <SettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Reglas globales de snapshot"
        description="Configura exclusiones base y el modo estricto que aplican a Repository Analysis, PR AI Review y futuras corridas que reutilicen el pipeline."
        footer={(
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600"
            >
              Listo
            </button>
          </div>
        )}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <SettingsToggleCard
            title="Modo estricto global"
            description="Bloquea el envio a Codex si el preflight detecta posibles secretos, archivos sensibles o cobertura insuficiente del snapshot."
            checked={snapshotPolicy.strictMode}
            onChange={(checked) => onChange({
              ...snapshotPolicy,
              strictMode: checked,
            })}
          />

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm leading-6 text-slate-600">
                <p className="font-medium text-slate-900">Preset rapido</p>
                <p className="mt-1">
                  Aplica una base recomendada de exclusiones para stacks conocidos sin sobrescribir el modo estricto.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange(applySnapshotPreset(snapshotPolicy, 'node'))}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-600"
              >
                Aplicar preset Node
              </button>
            </div>
          </div>

          <SettingsTextAreaField
            label="Patrones de paths excluidos"
            value={snapshotPolicy.excludedPathPatterns}
            placeholder={'Ejemplo:\n.env\n.env.*\nnode_modules/**\ndist/**\n*.pem\n*.key'}
            onChange={(value) => onChange({
              ...snapshotPolicy,
              excludedPathPatterns: value,
            })}
            span="xl:col-span-2"
            hint="Uno por linea. Se aplican a cualquier snapshot del producto antes del preflight y del envio a Codex."
          />

          <div className="xl:col-span-2">
            <SettingsNotice tone="warning">
              El preset <span className="font-medium">Node</span> excluye artefactos de build, dependencias, archivos de entorno y credenciales comunes. Puedes tomarlo como base y ajustarlo manualmente.
            </SettingsNotice>
          </div>
        </div>
      </SettingsModal>
    </SettingsSectionCard>
  );
};

export default GlobalSnapshotPolicyCard;
