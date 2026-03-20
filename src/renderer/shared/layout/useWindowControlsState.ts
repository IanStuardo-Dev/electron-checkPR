import React from 'react';
import {
  getElectronApi,
  invokeElectronApi,
  subscribeToWindowStateChange,
} from '../../shared/electron/electronBridge';

type WindowControlChannel =
  | 'window-controls:get-state'
  | 'window-controls:minimize'
  | 'window-controls:toggle-maximize'
  | 'window-controls:close';

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

function isWindowControlsState(value: unknown): value is WindowControlsState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<WindowControlsState>;
  return typeof candidate.isMaximized === 'boolean'
    && typeof candidate.isFullScreen === 'boolean'
    && typeof candidate.platform === 'string';
}

async function invokeWindowControl(channel: WindowControlChannel): Promise<WindowControlsState | null> {
  if (!getElectronApi()) {
    return null;
  }

  const response = await invokeElectronApi<unknown>(channel);

  if (response === null) {
    return null;
  }

  return isWindowControlsState(response) ? response : null;
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
