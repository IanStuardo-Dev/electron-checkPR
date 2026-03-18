# CheckPR Desktop Wiki

## Vision general

CheckPR Desktop es una aplicacion de escritorio construida con Electron, React y TypeScript para centralizar trabajo operativo sobre repositorios y Pull Requests.

El producto hoy cubre cuatro capacidades principales:

- conexion a providers de repositorios;
- exploracion de proyectos, repositorios, ramas y PRs;
- analisis de repositorio por rama con snapshots;
- flujos asistidos por IA para revision de PRs.

El runtime soportado es Electron. El renderer por si solo no es un target web soportado porque depende de IPC y bridge nativo.

## Estado funcional actual

Providers soportados:

- Azure DevOps
- GitHub
- GitLab

Backlog declarado:

- Bitbucket

Features relevantes ya implementadas:

- dashboard operativo con resumen y priorizacion;
- configuracion simplificada por modales;
- title bar custom integrada a la UI;
- sincronizacion de proyectos, repositorios, ramas y pull requests;
- repository analysis por rama;
- revision AI de Pull Requests;
- historial de snapshots del dashboard;
- quality gates locales y en CI.

## Stack principal

- Electron
- React 18
- TypeScript
- Webpack
- Tailwind CSS
- Jest + Testing Library
- Playwright
- ESLint
- dependency-cruiser
- jscpd

## Mapa rapido del repo

- `src/main`: proceso principal, ventana e IPC.
- `src/preload.ts`: bridge seguro entre renderer y Electron.
- `src/renderer`: aplicacion UI organizada por features.
- `src/services`: integraciones con providers y servicios de analisis.
- `src/shared`: contratos y utilitarios transversales.
- `src/types`: tipos compartidos del dominio.
- `tests`: unitarios, integracion y e2e.
- `scripts`: quality gates y chequeos arquitectonicos.

## Flujo de uso esperado

1. Abrir `Settings`.
2. Configurar provider, scope y token.
3. Sincronizar proyectos o repositorios.
4. Revisar el `Dashboard`.
5. Ejecutar `Repository Analysis` sobre una rama.
6. Lanzar analisis AI de Pull Requests si Codex/OpenAI esta configurado.
7. Revisar `History` para comparar snapshots.

## Documentacion recomendada

- [Arquitectura General](Arquitectura-General)
- [Renderer y Features](Renderer-y-Features)
- [Main, Preload e IPC](Main-Preload-e-IPC)
- [Servicios y Providers](Servicios-y-Providers)
- [Desarrollo Local y Build](Desarrollo-Local-y-Build)
- [Calidad, Testing y Buenas Practicas](Calidad-Testing-y-Buenas-Practicas)
- [Publicacion del Wiki](Publicacion-del-Wiki)
