# Desarrollo Local y Build

## Requisitos

- Node.js 20 o superior recomendado;
- npm;
- sistema operativo compatible con Electron.

## Instalacion

```bash
npm install
```

El `prepare` del repo configura `core.hooksPath` para usar hooks versionados en `.githooks/`.

## Desarrollo diario

Comando recomendado:

```bash
npm run start
```

Alias:

```bash
npm run dev
```

Este flujo:

- compila `main` en watch;
- levanta `webpack-dev-server`;
- espera renderer y `dist/main.js`;
- abre Electron apuntando al renderer de desarrollo.

## Build

Build productivo:

```bash
npm run build
```

Empaquetado:

```bash
npm run build:prod
```

## Scripts utiles

### Desarrollo

- `npm run start`
- `npm run dev`
- `npm run watch`

### Testing

- `npm run test`
- `npm run test:coverage`
- `npm run test:e2e`
- `npm run test:all`

### Calidad

- `npm run lint`
- `npm run typecheck`
- `npm run analyze:architecture`
- `npm run analyze:cycles`
- `npm run analyze:solid`
- `npm run analyze:duplicates`
- `npm run quality:check`

## Flujo recomendado antes de abrir un PR

1. `npm run lint`
2. `npm run typecheck`
3. `npm run analyze:architecture`
4. `npm run analyze:solid`
5. `npm run test`
6. si el cambio toca runtime o empaquetado, `npm run build`

## Notas practicas

- si tocas boundaries entre features, corre `npm run analyze:architecture`;
- si moviste naming o componentes parecidos, corre `npm run analyze:duplicates`;
- si tocaste imports en cascada, corre `npm run analyze:cycles`;
- si tocaste main/preload, no asumas que el renderer aislado valida esos cambios.
