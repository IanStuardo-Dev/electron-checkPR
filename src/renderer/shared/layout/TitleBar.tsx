import React from 'react';
import {
  ArrowsPointingOutIcon,
  MinusIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  getElectronApi,
  subscribeToWindowStateChange,
  invokeElectronApi,
} from '../../shared/electron/electronBridge';

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

interface TitleBarProps {
  pathname: string;
}

interface WindowControlButtonsProps {
  isMaximized: boolean;
  isFullScreen: boolean;
  onMinimize: () => Promise<void>;
  onToggleMaximize: () => Promise<void>;
  onClose: () => Promise<void>;
}

interface TrafficLightButtonProps {
  label: string;
  toneClassName: string;
  onClick: () => Promise<void>;
}

interface DesktopTitleBarButtonProps {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  onClick: () => Promise<void>;
  className?: string;
}

const TrafficLightButton = ({ label, toneClassName, onClick }: TrafficLightButtonProps) => (
  <button
    type="button"
    aria-label={label}
    onClick={() => { void onClick(); }}
    className={`h-3.5 w-3.5 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition duration-150 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${toneClassName}`}
  >
    <span className="sr-only">{label}</span>
  </button>
);

const DesktopTitleBarButton = ({
  label,
  Icon,
  onClick,
  className = '',
}: DesktopTitleBarButtonProps) => (
  <button
    type="button"
    aria-label={label}
    onClick={() => { void onClick(); }}
    className={`rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 ${className}`.trim()}
  >
    <Icon className="h-4 w-4" />
  </button>
);

const MacWindowControls = ({
  isFullScreen,
  onMinimize,
  onToggleMaximize,
  onClose,
}: WindowControlButtonsProps) => {
  const buttons = [
    {
      label: 'Close window',
      onClick: onClose,
      toneClassName: 'bg-rose-400 ring-1 ring-rose-500/20 hover:bg-rose-500 focus-visible:outline-rose-500',
    },
    {
      label: 'Minimize window',
      onClick: onMinimize,
      toneClassName: 'bg-amber-400 ring-1 ring-amber-500/20 hover:bg-amber-500 focus-visible:outline-amber-500',
    },
    {
      label: isFullScreen ? 'Exit full screen' : 'Enter full screen',
      onClick: onToggleMaximize,
      toneClassName: 'bg-emerald-400 ring-1 ring-emerald-500/20 hover:bg-emerald-500 focus-visible:outline-emerald-500',
    },
  ] satisfies TrafficLightButtonProps[];

  return (
    <div className="flex items-center" style={noDragRegionStyle}>
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 shadow-sm ring-1 ring-white/70 backdrop-blur">
        {buttons.map((button) => (
          <TrafficLightButton key={button.label} {...button} />
        ))}
      </div>
    </div>
  );
};

const DesktopWindowControls = ({
  isMaximized,
  onMinimize,
  onToggleMaximize,
  onClose,
}: WindowControlButtonsProps) => {
  const MaximizeIcon = isMaximized ? Squares2X2Icon : ArrowsPointingOutIcon;
  const buttons = [
    {
      label: 'Minimize window',
      onClick: onMinimize,
      Icon: MinusIcon,
    },
    {
      label: isMaximized ? 'Restore window' : 'Maximize window',
      onClick: onToggleMaximize,
      Icon: MaximizeIcon,
    },
    {
      label: 'Close window',
      onClick: onClose,
      Icon: XMarkIcon,
      className: 'hover:bg-rose-100 hover:text-rose-700',
    },
  ] satisfies DesktopTitleBarButtonProps[];

  return (
    <div className="flex items-center" style={noDragRegionStyle}>
      <div className="flex items-center rounded-2xl border border-slate-200/80 bg-white/80 p-1 shadow-sm ring-1 ring-white/70 backdrop-blur">
        {buttons.map((button) => (
          <DesktopTitleBarButton key={button.label} {...button} />
        ))}
      </div>
    </div>
  );
};

const TitleBar = ({ pathname }: TitleBarProps) => {
  const metadata = pageMetadata[pathname] ?? defaultMetadata;
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

  const isMacOS = supportsWindowControls && windowState.platform === 'darwin';

  return (
    <header
      className="border-b border-slate-200/80 bg-slate-100/95 backdrop-blur"
      style={dragRegionStyle}
    >
      <div className={`flex h-14 items-center gap-4 px-6 lg:px-10 ${isMacOS ? 'justify-start' : 'justify-between'}`}>
        <div className="flex min-w-0 items-center gap-4">
          {isMacOS ? (
            <MacWindowControls
              isMaximized={windowState.isMaximized}
              isFullScreen={windowState.isFullScreen}
              onMinimize={handleMinimize}
              onToggleMaximize={handleToggleMaximize}
              onClose={handleClose}
            />
          ) : null}

          <h2 className="truncate text-sm font-semibold tracking-[0.01em] text-slate-900">{metadata.title}</h2>
        </div>

        {supportsWindowControls && !isMacOS ? (
          <DesktopWindowControls
            isMaximized={windowState.isMaximized}
            isFullScreen={windowState.isFullScreen}
            onMinimize={handleMinimize}
            onToggleMaximize={handleToggleMaximize}
            onClose={handleClose}
          />
        ) : null}
      </div>
    </header>
  );
};

export default TitleBar;
