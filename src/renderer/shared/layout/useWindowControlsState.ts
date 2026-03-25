import React from 'react';
import {
  getElectronApi,
  invokeElectronApi,
  subscribeToWindowStateChange,
} from '../../shared/electron/electronBridge';

type WindowControlCommand =
  | 'window-controls:get-state'
  | 'window-controls:minimize'
  | 'window-controls:toggle-maximize'
  | 'window-controls:close';

interface WindowControlBridgeResponse {
  ok: boolean;
  data?: unknown;
  error?: string;
}

function detectRendererPlatform(): NodeJS.Platform {
  if (typeof navigator === 'undefined') {
    return 'win32';
  }

  const platformHint = (
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform
    ?? navigator.platform
    ?? ''
  ).toLowerCase();

  if (platformHint.includes('mac')) {
    return 'darwin';
  }

  if (platformHint.includes('win')) {
    return 'win32';
  }

  if (platformHint.includes('linux')) {
    return 'linux';
  }

  return 'win32';
}

async function invokeWindowControl(command: WindowControlCommand): Promise<WindowControlsState | null> {
  if (!getElectronApi()) {
    return null;
  }

  const response = await invokeElectronApi<unknown>(command);

  if (response === null) {
    return null;
  }

  if (
    typeof response === 'object'
    && response !== null
    && typeof (response as Partial<WindowControlBridgeResponse>).ok === 'boolean'
  ) {
    const bridgeResponse = response as WindowControlBridgeResponse;

    if (!bridgeResponse.ok) {
      throw new Error(bridgeResponse.error || 'No fue posible ejecutar el control de ventana.');
    }

    return (
      typeof bridgeResponse.data === 'object'
      && bridgeResponse.data !== null
      && typeof (bridgeResponse.data as Partial<WindowControlsState>).isMaximized === 'boolean'
      && typeof (bridgeResponse.data as Partial<WindowControlsState>).isFullScreen === 'boolean'
      && typeof (bridgeResponse.data as Partial<WindowControlsState>).platform === 'string'
    ) ? bridgeResponse.data as WindowControlsState : null;
  }

  return (
    typeof response === 'object'
    && response !== null
    && typeof (response as Partial<WindowControlsState>).isMaximized === 'boolean'
    && typeof (response as Partial<WindowControlsState>).isFullScreen === 'boolean'
    && typeof (response as Partial<WindowControlsState>).platform === 'string'
  ) ? response as WindowControlsState : null;
}

export function useWindowControlsState() {
  const supportsWindowControls = Boolean(getElectronApi()?.onWindowStateChange);
  const [windowState, setWindowState] = React.useState<WindowControlsState>({
    isMaximized: false,
    isFullScreen: false,
    platform: detectRendererPlatform(),
  });

  React.useEffect(() => {
    let isSubscribed = true;

    invokeWindowControl('window-controls:get-state')
      .then((state) => {
        if (state && isSubscribed) {
          setWindowState(state);
        }
      })
      .catch(() => undefined);

    const unsubscribe = subscribeToWindowStateChange((state) => {
      if (isSubscribed) {
        setWindowState(state);
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  const handleMinimize = React.useCallback(async () => {
    const nextState = await invokeWindowControl('window-controls:minimize');

    if (nextState) {
      setWindowState(nextState);
    }
  }, []);

  const handleToggleMaximize = React.useCallback(async () => {
    const nextState = await invokeWindowControl('window-controls:toggle-maximize');

    if (nextState) {
      setWindowState(nextState);
    }
  }, []);

  const handleClose = React.useCallback(async () => {
    await invokeWindowControl('window-controls:close');
  }, []);

  return {
    supportsWindowControls,
    windowState,
    handleMinimize,
    handleToggleMaximize,
    handleClose,
  };
}
