# Renderer Architecture

## Objetivo

Mantener el renderer organizado por capacidades, con dependencias predecibles y una API publica clara para cada feature.

## Estructura base

```text
src/renderer/
  app/
  features/
  shared/
  shims/
  styles/
```

### `app/`

Contiene el shell de la aplicacion, rutas y pages. Esta capa compone features; no implementa detalles internos de cada una.

### `features/`

Cada feature expone una API publica desde su `index.ts`.

Subcarpetas permitidas segun la complejidad de la feature:

- `application/`: reglas de orquestacion y casos de uso del renderer.
- `data/`: IPC, storage, fetchers y adaptadores.
- `presentation/`: componentes, hooks de UI, contextos y view models.

No todas las features necesitan las tres capas, pero cuando existan deben mantener esa direccion de dependencias:

`presentation -> application -> data`

### `shared/`

Contiene piezas realmente transversales:

- `layout/`: shell, sidebar, title bar y estados de carga compartidos.
- `ui/`: primitives y componentes reutilizables.
- `dashboard/`: contratos y builders de summary que no pertenecen a una feature concreta.

## Reglas de dependencia

### Regla 1

`src/renderer/app/**` solo puede consumir features a traves de su `index.ts`.

### Regla 2

Una feature no puede importar internals de otra feature. Solo puede consumir su API publica (`features/<feature>/index.ts`).

### Regla 3

El renderer no puede importar `src/main/**` ni `src/services/**`.

### Regla 4

Los tipos compartidos deben vivir en `src/types/**` o `src/shared/**`, no colgados de una feature ajena.

## Convenciones practicas

- Si un componente pesado arrastra dependencias grandes, la API publica debe exponer un loader asincromo o un wrapper, no el componente directamente.
- Si dos archivos comparten contratos largos, extraer un `*.types.ts` local antes de duplicar props.
- Si una pieza solo sirve a una feature, no moverla a `shared/`.
- Si una feature empieza a mezclar demasiadas capacidades, dividirla antes de que aparezcan imports cruzados o nombres engañosos.

## Enforcement

El proyecto valida estas reglas con:

- `npm run lint`
- `npm run analyze:architecture`
- `npm run analyze:duplicates`
- `npm run quality:check`

Antes de abrir un PR o mergear a `main`, estos comandos deben pasar en verde.
