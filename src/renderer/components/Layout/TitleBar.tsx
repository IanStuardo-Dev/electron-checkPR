import React from 'react';
import {
  ArrowsPointingOutIcon,
  MinusIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const dragRegionStyle = { WebkitAppRegion: 'drag' } as React.CSSProperties & { WebkitAppRegion: 'drag' };
const noDragRegionStyle = { WebkitAppRegion: 'no-drag' } as React.CSSProperties & { WebkitAppRegion: 'no-drag' };

type WindowControlChannel =
  | 'window-controls:get-state'
  | 'window-controls:minimize'
  | 'window-controls:toggle-maximize'
  | 'window-controls:close';

const pageMetadata: Record<string, { title: string }> = {
  '/': {
    title: 'Pull Requests',
  },
  '/history': {
    title: 'Review History',
  },
  '/repository-analysis': {
    title: 'Repository Intelligence',
  },
  '/settings': {
    title: 'Platform Settings',
  },
};

const defaultMetadata = {
  title: 'CheckPR',
};

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
  const response = await window.electronApi.invoke(channel);

  if (response === null) {
    return null;
  }

  return isWindowControlsState(response) ? response : null;
}

interface TitleBarProps {
  pathname: string;
}

const TitleBar = ({ pathname }: TitleBarProps) => {
  const metadata = pageMetadata[pathname] ?? defaultMetadata;
  const [windowState, setWindowState] = React.useState<WindowControlsState>({
    isMaximized: false,
    isFullScreen: false,
    platform: 'win32',
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

    const unsubscribe = window.electronApi.onWindowStateChange((state) => {
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

  const MaximizeIcon = windowState.isMaximized ? Squares2X2Icon : ArrowsPointingOutIcon;

  return (
    <header
      className="border-b border-slate-200/80 bg-slate-100/95 backdrop-blur"
      style={dragRegionStyle}
    >
      <div className="flex h-14 items-center justify-between gap-4 px-6 lg:px-10">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-[0.01em] text-slate-900">{metadata.title}</h2>
        </div>

        <div className="flex items-center" style={noDragRegionStyle}>
          <div className="flex items-center rounded-xl border border-slate-200/80 bg-white/80 p-1">
            <button
              type="button"
              aria-label="Minimize window"
              onClick={handleMinimize}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={windowState.isMaximized ? 'Restore window' : 'Maximize window'}
              onClick={handleToggleMaximize}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <MaximizeIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Close window"
              onClick={handleClose}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-100 hover:text-rose-700"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TitleBar;
