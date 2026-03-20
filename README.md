# CheckPR Desktop

Aplicacion de escritorio construida con Electron, React y TypeScript para centralizar la revision operativa de Pull Requests, analizar repositorios y ejecutar flujos asistidos por AI sobre cambios de codigo.

Hoy el proyecto esta orientado a uso local en escritorio y corre sobre Electron. El renderer web por si solo no es un runtime soportado.

## Que resuelve

CheckPR Desktop busca concentrar en una sola interfaz:

- conexion a providers de repositorios
- carga de proyectos, repositorios, ramas y Pull Requests
- dashboard operativo para priorizar revision
- analisis de repositorio por rama
- analisis AI de Pull Requests
- configuracion de proveedor, politicas de snapshot e integracion con Codex/OpenAI
- persistencia local de contexto operativo e historico del dashboard

## Estado actual

Providers soportados hoy:

- `Azure DevOps`
- `GitHub`
- `GitLab`

Backlog declarado:

- `Bitbucket`

Capacidades relevantes ya implementadas:

- dashboard con metricas, prioridades, alertas y carga de trabajo
- sincronizacion de proyectos, repositorios, ramas y Pull Requests
- analisis de repositorio con snapshot previo
- modal de revision AI para Pull Requests
- configuracion simplificada por modales
- title bar integrada a la UI y controles de ventana custom
- quality gates locales y en CI

## Stack principal

- `Electron`
- `React 18`
- `TypeScript`
- `Webpack`
- `Tailwind CSS`
- `Jest` + `Testing Library`
- `Playwright`
- `ESLint`
- `dependency-cruiser`
- `jscpd`

## Arquitectura

El proyecto sigue una separacion pragmatica por runtime y responsabilidad:

- `src/main`
  Proceso principal de Electron, bootstrap, ventana, identidad de app e IPC.

- `src/preload.ts`
  Bridge seguro entre renderer y capacidades nativas permitidas.

- `src/renderer`
  UI de la aplicacion, organizada por features y shared modules.

- `src/services`
  Integraciones con providers, snapshots, servicios de analisis y logica compartida de infraestructura.

- `src/shared`
  Helpers y contratos transversales que no pertenecen a una feature especifica.

- `tests`
  Suites unitarias e integracion para `main`, `renderer` y `services`.

Dentro del renderer se trabaja por features, por ejemplo:

- `repository-source`
- `repository-analysis`
- `pull-request-ai`
- `dashboard`
- `history`
- `settings`

## Estructura del proyecto

```text
.
|- src/
|  |- main/
|  |- renderer/
|  |  |- app/
|  |  |- features/
|  |  |- shared/
|  |- services/
|  |- shared/
|  |- types/
|- tests/
|- docs/
|- scripts/
|- .githooks/
|- .github/
```

## Requisitos

- `Node.js 24.x` recomendado
- `npm`
- Windows, macOS o Linux con soporte para Electron

## Instalacion

```bash
npm install
```

El repo usa hooks versionados. El script `prepare` configura `core.hooksPath` automaticamente al instalar dependencias.

## Desarrollo local

Levantar la aplicacion en modo desarrollo:

```bash
npm run start
```

Alias disponible:

```bash
npm run dev
```

Que hace este flujo:

- compila `main` y `renderer`
- levanta `webpack-dev-server`
- espera a que `dist/main.js` y el renderer esten disponibles
- abre Electron con el bridge seguro cargado por `preload`

## Build

Build productivo del proyecto:

```bash
npm run build
```

Empaquetado con Electron Builder:

```bash
npm run build:prod
```

## Flujo de uso esperado

1. Abrir `Settings`.
2. Configurar provider, scope y token.
3. Sincronizar proyectos o repositorios.
4. Ir al `Dashboard` para revisar estado operativo.
5. Usar `Repository Analysis` para generar un snapshot por rama y analizarlo.
6. Ejecutar revisiones AI de Pull Requests si la integracion de Codex/OpenAI esta configurada.
7. Revisar `History` para comparar snapshots del dashboard.

## Scripts utiles

Desarrollo:

- `npm run start`
- `npm run dev`
- `npm run watch`

Tests:

- `npm run test`
- `npm run test:coverage`
- `npm run test:e2e`
- `npm run test:all`

Calidad:

- `npm run lint`
- `npm run typecheck`
- `npm run analyze:architecture`
- `npm run analyze:cycles`
- `npm run analyze:solid`
- `npm run analyze:duplicates`
- `npm run quality:check`

Gates locales:

- `npm run guard:commit`
- `npm run guard:push`

## Quality Gates

El repositorio ya viene preparado para bloquear regresiones antes de commit y push.

Capas activas:

- hooks locales en `.githooks/`
- lint y typecheck
- verificacion de boundaries de arquitectura
- reglas de capas con `dependency-cruiser`
- deteccion de ciclos
- control de duplicacion con `jscpd`
- suite de tests con cobertura
- build productivo

Referencia detallada:

- [docs/quality-gates.md](docs/quality-gates.md)

## Testing

La suite esta pensada para proteger refactors y crecimiento del producto.

Actualmente el baseline de calidad esperado es:

- tests unitarios para `main`, `renderer` y `services`
- tests de integracion del renderer
- cobertura alta y gates obligatorios

Para validar todo localmente:

```bash
npm run quality:check
```

## Seguridad y runtime

Puntos importantes del proyecto:

- la app corre en `Electron`, no como SPA web soportada
- `nodeIntegration` esta desactivado
- `contextIsolation` esta activado
- la comunicacion nativa pasa por canales IPC permitidos explicitamente en `preload`
- los secretos de sesion se manejan via bridge nativo

Si abres solo el renderer en navegador, no tendras acceso a integraciones nativas, sincronizacion por IPC ni analisis completos.

## Tokens y permisos

Segun el provider, necesitaras credenciales con permisos de lectura sobre repositorios y Pull Requests.

Ejemplos:

- `Azure DevOps`: PAT con permisos de lectura sobre Code
- `GitHub`: token clasico o fine-grained con permisos de lectura sobre Pull Requests y Contents
- `GitLab`: personal access token con scopes de lectura sobre API y repositorios

## Convenciones del repo

- cambios de codigo con `apply_patch`
- hooks y CI como linea base obligatoria
- boundaries de arquitectura controlados automaticamente
- PRs documentados en espanol

## Roadmap cercano

- seguir fortaleciendo enforcement arquitectonico
- continuar ampliando cobertura de integraciones
- mejorar experiencia de analisis y configuracion
- evaluar soporte futuro para Bitbucket

## Comandos recomendados antes de abrir un PR

```bash
npm run quality:check
```

Y si quieres revisar solo arquitectura:

```bash
npm run analyze:architecture
```

## Licencia

`ISC`
