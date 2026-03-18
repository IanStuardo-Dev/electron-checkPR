# Arquitectura General

## Principios base

El proyecto sigue una separacion pragmatica por runtime y responsabilidad:

- `main` gestiona Electron, ventana e IPC;
- `preload` expone solo capacidades permitidas;
- `renderer` contiene la UI y la composicion por features;
- `services` encapsula integraciones externas y fabricas de analisis;
- `shared` y `types` deben mantenerse desacoplados de capas de aplicacion.

No es una clean architecture academica pura, pero si tiene boundaries obligatorios y automatizados.

## Capas principales

### `src/main`

Responsabilidades:

- bootstrap de Electron;
- configuracion de storage de app;
- creacion de `BrowserWindow`;
- registro de handlers IPC;
- coordinacion de servicios de analisis y providers.

Piezas importantes:

- `src/main.ts`
- `src/main/application-bootstrap.ts`
- `src/main/main-window.ts`
- `src/main/ipc/*`

### `src/preload.ts`

Responsabilidades:

- validar canales IPC permitidos;
- exponer `window.electronApi`;
- evitar acceso directo del renderer a APIs nativas no aprobadas.

Es una frontera de seguridad, no un lugar para meter logica de negocio.

### `src/renderer`

Responsabilidades:

- paginas, componentes y contextos de UI;
- hooks de composicion por feature;
- estado de pantalla y flujos interactivos.

Organizacion dominante:

- `app/`: paginas y rutas;
- `features/`: vertical slices del renderer;
- `shared/`: layout y helpers compartidos del renderer;
- `ui/`: primitives visuales reutilizables.

### `src/services`

Responsabilidades:

- adaptadores hacia Azure, GitHub y GitLab;
- factories de servicios de analisis;
- composicion del registry de providers;
- infraestructura compartida entre analisis y providers.

### `src/shared` y `src/types`

Regla clave:

- no deben depender de `renderer`, `main` ni `services`.

Se usan para contratos y utilitarios verdaderamente transversales.

## Boundaries obligatorios

El repo tiene enforcement explicito para:

- `renderer` no importa `main` ni `services`;
- `main` no importa `renderer`;
- `services` no importa `main` ni `renderer`;
- `shared` y `types` no dependen de capas de aplicacion;
- `app` consume APIs publicas de features, no internals;
- una feature del renderer no debe importar internals de otra feature;
- `renderer/shared` no debe depender de internals de features.

Estos checks viven principalmente en:

- `scripts/check-renderer-architecture.js`
- `.dependency-cruiser.cjs`

## Runtime y direccion de dependencias

```text
Renderer UI
  -> preload bridge
  -> IPC
  -> main
  -> servicios / providers
```

Dentro del renderer:

```text
app
  -> feature public APIs
feature presentation
  -> feature application/data
shared/ui
  -> sin depender de internals de features
```

## Decisiones importantes del proyecto

- El provider activo y el estado operativo viven en el renderer bajo `repository-source`.
- Los providers reales y el analisis corren del lado seguro, no en el renderer puro.
- La app privilegia modales y workflows guiados para no saturar la vista principal.
- El proyecto usa quality gates como linea base, no como “check opcional”.

## Riesgos arquitectonicos recurrentes

- reexportar demasiado desde una feature y volver opaca su API publica;
- meter en `shared` cosas que siguen sesgadas a una feature;
- acoplar features por imports a `data/` o `presentation/` de otras features;
- duplicar condicionales por provider en varios puntos del renderer;
- mezclar UI state, persistencia y reglas de negocio en un mismo hook.
