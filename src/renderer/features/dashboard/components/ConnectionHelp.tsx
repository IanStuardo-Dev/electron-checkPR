import React from 'react';
import type { RepositoryProviderKind } from '../../../../types/repository';

interface ConnectionHelpProps {
  provider: RepositoryProviderKind;
}

const ConnectionHelp = ({ provider }: ConnectionHelpProps) => (
  <div className="rounded-3xl border border-sky-100 bg-sky-50 p-5 text-sm text-slate-700">
    <div className="space-y-3">
      <div>
        <p className="font-semibold text-slate-900">Ayuda para conectarte</p>
        <p className="mt-1 text-slate-600">
          {provider === 'github'
            ? 'Necesitas owner y token para cargar repositorios, ramas y Pull Requests desde GitHub.'
            : provider === 'gitlab'
              ? 'Necesitas namespace y token para cargar proyectos, ramas y Merge Requests desde GitLab.'
            : 'Necesitas tres datos para cargar PRs reales desde Azure DevOps.'}
        </p>
      </div>

      {provider === 'github' ? (
        <div className="space-y-2">
          <p><span className="font-medium text-slate-900">Owner / Organization:</span> es el nombre del owner en la URL <code>https://github.com/tu-owner</code>.</p>
          <p><span className="font-medium text-slate-900">Repository:</span> se carga automáticamente después de ingresar owner y token.</p>
          <p><span className="font-medium text-slate-900">Token:</span> usa un personal access token con permisos para leer repositorio, ramas y pull requests.</p>
        </div>
      ) : provider === 'gitlab' ? (
        <div className="space-y-2">
          <p><span className="font-medium text-slate-900">Group / Namespace:</span> usa el namespace visible en la URL <code>https://gitlab.com/tu-grupo</code>.</p>
          <p><span className="font-medium text-slate-900">Project:</span> se carga automáticamente después de ingresar namespace y token.</p>
          <p><span className="font-medium text-slate-900">Token:</span> usa un personal access token con permisos para leer API y repositorios.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p><span className="font-medium text-slate-900">Organization:</span> es el nombre que aparece en la URL <code>https://dev.azure.com/tu-organizacion</code>.</p>
          <p><span className="font-medium text-slate-900">Project:</span> se carga automáticamente después de ingresar organización y PAT.</p>
          <p><span className="font-medium text-slate-900">PAT:</span> créalo en Azure DevOps desde <code>User settings &gt; Personal access tokens</code> con permisos de lectura sobre <code>Code</code>.</p>
        </div>
      )}

      <div className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-xs text-slate-600">
        Recomendación: usa un token de solo lectura para minimizar riesgo. La app no persiste la configuracion del provider al cerrar y no guarda el secreto en disco.
      </div>
    </div>
  </div>
);

export default ConnectionHelp;
