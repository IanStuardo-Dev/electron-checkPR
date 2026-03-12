import React from 'react';
import { CheckCircleIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import type { CodexIntegrationConfig } from '../../dashboard/types';
import {
  SettingsField,
  SettingsSectionCard,
  SettingsSelectField,
  SettingsStatTile,
  SettingsStatusBadge,
  SettingsTextAreaField,
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      <SettingsStatTile
        label="PR AI Review"
        value={config.prReview.enabled ? `${config.prReview.maxPullRequests}` : 'Off'}
        description="Cantidad de PRs que recibirán analisis IA por sincronizacion."
      />
    </div>

    <div className="mt-6 grid gap-4 xl:grid-cols-2">
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

      <SettingsToggleCard
        title="Habilitar PR AI Review"
        description="Activa el analisis IA sobre la cola priorizada de Pull Requests en el dashboard."
        checked={config.prReview.enabled}
        onChange={(checked) => onChange('prReview', {
          ...config.prReview,
          enabled: checked,
        })}
      />

      <SettingsField
        label="Maximo de PRs por sincronizacion"
        type="number"
        value={config.prReview.maxPullRequests}
        onChange={(value) => onChange('prReview', {
          ...config.prReview,
          maxPullRequests: Number(value) || 0,
        })}
      />

      <SettingsSelectField
        label="Modo de seleccion"
        value={config.prReview.selectionMode}
        onChange={(value) => onChange('prReview', {
          ...config.prReview,
          selectionMode: value as CodexIntegrationConfig['prReview']['selectionMode'],
        })}
        options={[
          { value: 'top-risk', label: 'Top risk' },
          { value: 'oldest', label: 'Oldest' },
          { value: 'mixed', label: 'Mixed' },
        ]}
      />

      <SettingsSelectField
        label="Profundidad PR AI"
        value={config.prReview.analysisDepth}
        onChange={(value) => onChange('prReview', {
          ...config.prReview,
          analysisDepth: value as CodexIntegrationConfig['prReview']['analysisDepth'],
        })}
        options={[
          { value: 'standard', label: 'Standard' },
          { value: 'deep', label: 'Deep' },
        ]}
      />
    </div>

    <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Politicas de analisis</h3>
        <SettingsStatusBadge
          tone="sky"
          label={`${countConfiguredPolicies(config)} activas`}
        />
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Define reglas del negocio o arquitectura que quieras que Codex examine en cada corrida.
        Esto agrega contexto real y vuelve el analisis mucho mas valioso que un review generico.
      </p>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
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
    </div>
  </SettingsSectionCard>
);

function countConfiguredPolicies(config: CodexIntegrationConfig): number {
  const directives = config.promptDirectives;

  return [
    directives.architectureReviewEnabled,
    Boolean(directives.architecturePattern.trim()),
    Boolean(directives.requiredPractices.trim()),
    Boolean(directives.forbiddenPractices.trim()),
    Boolean(directives.domainContext.trim()),
    Boolean(directives.customInstructions.trim()),
  ].filter(Boolean).length;
}

export default CodexIntegrationCard;
