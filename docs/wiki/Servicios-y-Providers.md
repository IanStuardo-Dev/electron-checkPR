# Servicios y Providers

## Objetivo de `src/services`

La carpeta `src/services` concentra integraciones remotas y fabricas de servicios que no pertenecen al renderer.

Subdominios principales:

- `analysis`
- `azure`
- `github`
- `gitlab`
- `providers`
- `shared`
- `notifications`

## Registry de providers

`src/services/providers/repository-provider.bootstrap.ts` construye los puertos por defecto:

- Azure DevOps
- GitHub
- GitLab

La composicion usa un registry para que el resto del sistema no dependa de implementaciones concretas dispersas.

## Providers soportados

### Azure DevOps

Cobertura relevante:

- repositorios;
- pull requests;
- snapshots asociados a analisis.

### GitHub

Cobertura relevante:

- listado de repositorios;
- ramas;
- pull requests;
- snapshots de repositorio y PR.

### GitLab

Cobertura relevante:

- proyectos;
- merge requests;
- snapshots y ramas.

### Bitbucket

Hoy aparece en tipos y UI de backlog, pero no como provider operativo en el bootstrap por defecto.

## Servicios de analisis

El proyecto tiene dos grandes fabricas:

- repository analysis
- pull request analysis

Ambas usan snapshot providers que dependen del registry de providers, no de un provider hardcodeado.

## Responsabilidades correctas en servicios

Deberian vivir aqui:

- requests a APIs remotas;
- normalizacion de respuestas;
- armado de snapshots;
- adaptacion de modelos remotos al dominio interno;
- factories de servicios que ensamblan dependencias.

No deberian vivir aqui:

- componentes React;
- hooks del renderer;
- dependencias a `main` o `renderer`;
- accesos directos a UI state.

## Criterios para agregar un nuevo provider

1. definir o extender el contrato del provider;
2. implementar adaptadores del provider en `src/services/<provider>`;
3. registrar el provider en el bootstrap;
4. revisar tipos y metadata del renderer;
5. encapsular diferencias de comportamiento en un lugar unico;
6. agregar tests por servicio, boundaries y feature integration.

## Olor comun a evitar

Cuando una diferencia entre providers obliga a tocar varios hooks y utilitarios del renderer al mismo tiempo, probablemente falte una abstraccion de comportamiento por provider o un contrato mejor definido.
