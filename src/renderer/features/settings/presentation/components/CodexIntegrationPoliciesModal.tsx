import React from 'react';
import type { CodexIntegrationConfig } from '../../types';
import {
  SettingsField,
  SettingsModal,
  SettingsStatusBadge,
  SettingsSurfaceCard,
  SettingsTextAreaField,
  SettingsToggleCard,
  settingsButtonClassName,
} from '../../../../shared/ui/settings/SettingsPrimitives';
import { countConfiguredPolicies } from './CodexIntegration.shared';
import type { CodexIntegrationChangeHandler } from './CodexIntegration.shared';

interface CodexIntegrationPoliciesModalProps {
  config: CodexIntegrationConfig;
  isOpen: boolean;
  onClose: () => void;
  onChange: CodexIntegrationChangeHandler;
}

export const CodexIntegrationPoliciesModal = ({
  config,
  isOpen,
  onClose,
  onChange,
}: CodexIntegrationPoliciesModalProps) => (
  <>
    <SettingsSurfaceCard className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Politicas avanzadas</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Reglas de arquitectura, contexto del dominio y directivas para PR AI Review.
          </p>
        </div>
        <SettingsStatusBadge tone="sky" label={`${countConfiguredPolicies(config)} activas`} />
      </div>
    </SettingsSurfaceCard>

    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Politicas avanzadas de Codex"
      description="Define criterios arquitectonicos, contexto de negocio y reglas especificas para la revision IA de Pull Requests."
      footer={(
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={settingsButtonClassName}
          >
            Listo
          </button>
        </div>
      )}
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <SettingsTextAreaField
          label="Focus areas para PR AI Review"
          value={config.prReview.promptDirectives.focusAreas}
          placeholder={'Ejemplo:\n- revisar autenticacion y permisos\n- priorizar regresiones en API\n- detectar cambios riesgosos en infraestructura'}
          onChange={(value) => onChange('prReview', {
            ...config.prReview,
            promptDirectives: {
              ...config.prReview.promptDirectives,
              focusAreas: value,
            },
          })}
          hint="Orientaciones específicas para la revision IA de Pull Requests."
        />

        <SettingsTextAreaField
          label="Instrucciones extra para PR AI Review"
          value={config.prReview.promptDirectives.customInstructions}
          placeholder="Qué tipo de comentarios, checklist o tono debe priorizar la IA al resumir un PR."
          onChange={(value) => onChange('prReview', {
            ...config.prReview,
            promptDirectives: {
              ...config.prReview.promptDirectives,
              customInstructions: value,
            },
          })}
          hint="Contexto adicional para la cola de PRs. No afecta Repository Analysis."
        />

        <SettingsToggleCard
          title="Forzar revision de arquitectura"
          description="Hace que Codex priorice estructura de capas, boundaries y cumplimiento de estilo arquitectonico."
          checked={config.promptDirectives.architectureReviewEnabled}
          onChange={(checked) => onChange('promptDirectives', {
            ...config.promptDirectives,
            architectureReviewEnabled: checked,
          })}
        />

        <SettingsField
          label="Patron o estilo a validar"
          value={config.promptDirectives.architecturePattern}
          placeholder="hexagonal, clean architecture, modular monolith, vertical slices..."
          onChange={(value) => onChange('promptDirectives', {
            ...config.promptDirectives,
            architecturePattern: value,
          })}
          hint="Opcional. Úsalo cuando quieras que evalúe explícitamente un patrón."
        />

        <SettingsTextAreaField
          label="Practicas obligatorias"
          value={config.promptDirectives.requiredPractices}
          placeholder={'Ejemplo:\n- Los casos de uso no deben depender de infraestructura\n- Todo acceso a datos debe pasar por repositorios\n- Debe existir validacion de input en borde'}
          onChange={(value) => onChange('promptDirectives', {
            ...config.promptDirectives,
            requiredPractices: value,
          })}
          span="xl:col-span-2"
          hint="Lista de chequeos que quieres exigir siempre."
        />

        <SettingsTextAreaField
          label="Anti-patrones o practicas prohibidas"
          value={config.promptDirectives.forbiddenPractices}
          placeholder={'Ejemplo:\n- Logica de negocio en controllers\n- Acceso directo a base de datos desde UI\n- Singletons globales para estado critico'}
          onChange={(value) => onChange('promptDirectives', {
            ...config.promptDirectives,
            forbiddenPractices: value,
          })}
          hint="Todo lo que Codex debe marcar como problema aunque el código funcione."
        />

        <SettingsTextAreaField
          label="Contexto del dominio"
          value={config.promptDirectives.domainContext}
          placeholder="Qué hace el sistema, criticidad del dominio, restricciones regulatorias, contexto técnico..."
          onChange={(value) => onChange('promptDirectives', {
            ...config.promptDirectives,
            domainContext: value,
          })}
          hint="Ayuda a que Codex entienda por qué ciertas decisiones importan."
        />

        <SettingsTextAreaField
          label="Instrucciones personalizadas"
          value={config.promptDirectives.customInstructions}
          placeholder="Cualquier instruccion extra para el analisis: prioridades, foco especial, estilo del reporte..."
          onChange={(value) => onChange('promptDirectives', {
            ...config.promptDirectives,
            customInstructions: value,
          })}
          span="xl:col-span-2"
          hint="Texto libre para reglas adicionales de tu equipo o arquitectura."
        />
      </div>
    </SettingsModal>
  </>
);
