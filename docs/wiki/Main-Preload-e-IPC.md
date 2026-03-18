# Main, Preload e IPC

## Proceso principal

El entrypoint real es `src/main.ts`.

Secuencia principal:

1. configura paths de storage;
2. define `AppUserModelId`;
3. al hacer `app.whenReady()` bootstrappea servicios y handlers;
4. crea la ventana principal;
5. maneja comportamiento de cierre y reactivacion en macOS.

## Creacion de ventana

`src/main/main-window.ts` define:

- `frame: false`
- `titleBarStyle: hidden`
- `backgroundColor`
- `preload: dist/preload.js`
- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`

Esto confirma que la UI depende del bridge seguro y no del acceso libre a Node.

## Bootstrap de aplicacion

`src/main/application-bootstrap.ts` compone:

- registry de providers;
- `repositoryAnalysisService`;
- `pullRequestAnalysisService`;
- registro de handlers IPC;
- creacion de la ventana principal.

## Preload

`src/preload.ts` es una whitelist de canales.

Canales permitidos hoy:

- window controls;
- repository source;
- repository analysis;
- pull request AI analysis;
- session secrets.

No deberian agregarse canales “por comodidad”. Cada nuevo canal es una decision de seguridad y arquitectura.

## IPC

Los handlers IPC viven en `src/main/ipc/`.

Responsabilidades tipicas:

- saneamiento de payloads;
- adaptacion entre renderer y servicios;
- apertura de enlaces externos;
- control de ventana;
- acceso a secretos de sesion.

## Regla de seguridad

El renderer no debe tener acceso directo a APIs nativas.

Todo acceso a Electron debe pasar por:

1. `window.electronApi` en preload;
2. canal permitido;
3. handler registrado en `main`.

## Buenas practicas para nuevos handlers

- definir el canal en preload y mantener la whitelist acotada;
- validar datos de entrada en `main`;
- tipar payload y respuesta;
- evitar meter logica de negocio pesada en el handler;
- delegar a servicios y use cases ya existentes;
- si el canal opera sobre archivos o red, dejar claro su ownership.

## Controles de ventana

El proyecto usa title bar custom.

Eso implica:

- sincronizacion de estado de ventana hacia el renderer;
- manejo especial en macOS para full screen;
- cuidado extra al cambiar maximize/minimize/full screen para no romper la semantica nativa.
