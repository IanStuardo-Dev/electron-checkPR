# Calidad, Testing y Buenas Practicas

## Filosofia del repo

La calidad no depende solo de review manual. El proyecto intenta automatizar los proxies mas utiles de arquitectura sana y disciplina de cambio.

## Quality gates

Capas activas hoy:

- lint;
- typecheck;
- chequeo de arquitectura custom;
- reglas de capas con dependency-cruiser;
- deteccion de ciclos;
- deteccion de duplicacion con jscpd;
- tests con coverage;
- build productivo.

Scripts principales:

- `npm run guard:commit`
- `npm run guard:push`
- `npm run quality:check`

CI:

- `.github/workflows/quality-gate.yml`

## Hooks locales

El repo versiona hooks en `.githooks/`.

- `pre-commit` corre el gate de commit;
- `pre-push` corre el gate completo.

Esto busca evitar que los checks vivan solo en CI.

## Testing

Capas de testing hoy:

- unit tests de `main`;
- unit tests de `renderer`;
- unit tests de `services`;
- integration tests del renderer;
- e2e con Playwright.

Estructura:

- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `tests/support`

## Buenas practicas de testing

- cubrir regresiones reales, no solo snapshots triviales;
- preferir tests focalizados cuando el cambio es arquitectonico;
- si un hook orquesta mucho comportamiento, validar el caso feliz y la regresion concreta;
- cuando un refactor cambia boundaries, agregar tests que hagan visible la nueva API publica;
- no usar mocks que escondan precisamente el contrato que intentas proteger.

## Buenas practicas de arquitectura

- una feature consume solo la API publica de otra;
- `shared` debe seguir siendo realmente compartido;
- evita nombres legacy que distorsionen el dominio actual;
- no mezcles persistencia, UI state y negocio en el mismo hook;
- encapsula comportamiento variable por provider, no lo repitas;
- si una abstraccion necesita `eslint-disable` para hooks o dependencias, probablemente haya que rediseñarla.

## Buenas practicas de diseño de codigo

- preferir cambios minimos y explicitos;
- mantener ownership claro por modulo;
- extraer helpers o componentes solo cuando reducen complejidad real;
- evitar “Facade”, “Manager” u “Operations” cuando no agregan semantica;
- no ampliar barrels sin pensar en la API publica real.

## Checklist de revision tecnica

- el cambio respeta boundaries entre layers y features;
- no introduce nuevos imports a internals ajenos;
- no deja duplicacion evitable;
- no rompe tests focalizados del area;
- mantiene naming alineado al dominio actual;
- no expone secretos ni abre canales IPC innecesarios.
