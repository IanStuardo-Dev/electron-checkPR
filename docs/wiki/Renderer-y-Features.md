# Renderer y Features

## Estructura del renderer

El renderer esta organizado alrededor de `src/renderer/app` y `src/renderer/features`.

### `app`

Contiene paginas y ruteo:

- `Dashboard`
- `RepositoryAnalysis`
- `Settings`

`WorkspaceRoutes.tsx` monta `RepositorySourceProvider` y envuelve las rutas con `Suspense`.

### `features`

Features principales hoy:

- `repository-source`
- `repository-analysis`
- `pull-request-ai`
- `dashboard`
- `history`
- `settings`

Cada feature deberia exponer una API publica clara desde su `index.ts`.

## Feature: `repository-source`

Es la pieza central del workspace operativo.

Responsabilidades:

- configurar provider, organization, project y repository;
- sincronizar proyectos, repositorios y PRs;
- exponer el contexto operativo del provider activo;
- construir diagnostico y snapshots del dashboard.

Partes clave:

- `presentation/context/RepositorySourceContext.tsx`
- `presentation/hooks/useRepositorySource.ts`
- `application/*`
- `data/*`

Es la feature mas sensible desde el punto de vista arquitectonico porque muchas otras dependen de su API publica.

## Feature: `repository-analysis`

Responsabilidades:

- preparar el request de analisis de repositorio;
- seleccionar rama;
- ejecutar y cancelar analisis;
- mostrar resultados y snapshots.

Debe depender de la API publica de `repository-source`, nunca de internals.

## Feature: `pull-request-ai`

Responsabilidades:

- disparar analisis AI de PRs;
- resumir hallazgos;
- mostrar resultados de revision asistida.

Se apoya en la configuracion de Codex y en snapshots/servicios de analisis.

## Feature: `settings`

Responsabilidades:

- concentrar configuracion de provider;
- configurar integracion Codex/OpenAI;
- exponer diagnostico y politicas globales.

La tendencia actual del proyecto es mantener `Settings` simplificado y mover detalle tecnico a modales dedicados.

## Feature: `dashboard`

Responsabilidades:

- mostrar resumen operativo del workspace;
- priorizar PRs;
- resumir carga de trabajo, riesgo y backlog.

## Feature: `history`

Responsabilidades:

- persistir y mostrar snapshots historicos del dashboard;
- servir de capa de almacenamiento para comparativas de estado.

## Que deberia quedar fuera del renderer

No deberia vivir en el renderer:

- acceso nativo directo a Electron;
- logica de provider que dependa de APIs remotas;
- secretos persistidos en disco fuera de canales controlados;
- validaciones de seguridad del request que correspondan a `main`.

## Buenas practicas al trabajar en features

- exponer contratos publicos pequenos desde `index.ts`;
- preferir nombres que expresen intencion y ownership;
- evitar hooks “fachada” que solo reenvian llamadas sin agregar valor real;
- no importar `data/`, `presentation/` o `application/` de otra feature;
- si una regla cambia por provider, encapsularla en un contrato comun en vez de repetir ternarios;
- cuando un modulo deja de ser realmente shared, devolverlo a su bounded context.
