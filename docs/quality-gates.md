# Quality Gates

## Objetivo

Evitar commits y pushes que rompan:

- tests
- arquitectura
- proxies automatizables de SOLID

## Capas de enforcement

### Local

El repo versiona hooks en `.githooks/`:

- `pre-commit`: ejecuta `npm run guard:commit`
- `pre-push`: ejecuta `npm run guard:push`

El script `npm run prepare` configura `core.hooksPath` para apuntar a `.githooks`.

### CI

GitHub Actions ejecuta `npm run quality:check` en cada `push` y `pull_request`.

## Clean Architecture obligatoria

La verificacion de arquitectura tiene dos capas complementarias:

- `check-renderer-architecture.js`
  Reglas especificas del proyecto:
  - consumo de APIs publicas de features
  - limites entre `app`, `features` y `shared`
  - restricciones entre `renderer`, `main`, `services`, `shared` y `types`

- `dependency-cruiser`
  Reglas formales de dependencias:
  - ciclos
  - imports entre capas prohibidas
  - acceso de `app` a internals de features
  - acceso de `data/application` a `presentation`

La idea es que el output diga exactamente:

- archivo origen
- archivo destino
- regla violada
- comentario de por que esa dependencia rompe la arquitectura

## Scripts clave

- `npm run analyze:architecture`
  Valida boundaries entre `renderer`, `main`, `services`, `shared`, `types`, APIs publicas de features y reglas formales de capas con `dependency-cruiser`.

- `npm run analyze:cycles`
  Falla si existen ciclos de importacion dentro de `src/`.

- `npm run analyze:solid`
  Ejecuta proxies automatizables para diseño sano:
  - ciclos
  - duplicacion

- `npm run guard:commit`
  Corre el gate obligatorio antes de cada commit.

- `npm run guard:push`
  Corre el gate completo antes de cada push.

- `npm run quality:check`
  Gate completo para CI y validacion integral local.

## Nota importante

SOLID no puede probarse al 100% de forma automatica. En este repo lo aproximamos con reglas verificables:

- clean architecture por capas y direccion de dependencias
- boundaries de arquitectura
- ausencia de ciclos
- duplicacion controlada
- lint y typecheck
- tests
- build

## Recomendacion de nivel TL

Para que esto no dependa solo del clon local:

1. activa branch protection sobre `main`
2. marca `quality-gate` como required status check
3. exige pull request review
4. opcionalmente usa `CODEOWNERS` para forzar review en cambios estructurales

Para volver esto realmente obligatorio en `main`, configura en GitHub branch protection con `quality-gate` como required status check.
