import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface SettingsNoticeProps {
  tone: 'warning' | 'error' | 'success';
  children: React.ReactNode;
}

export const SettingsNotice = ({ tone, children }: SettingsNoticeProps) => {
  const toneConfig = {
    warning: {
      className: 'border-amber-200 bg-amber-50 text-amber-800',
      icon: <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />,
    },
    error: {
      className: 'border-rose-200 bg-rose-50 text-rose-700',
      icon: <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />,
    },
    success: {
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      icon: <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />,
    },
  } as const;

  return (
    <div className={`flex gap-3 rounded-2xl border px-4 py-3 text-sm ${toneConfig[tone].className}`}>
      {toneConfig[tone].icon}
      <div className="min-w-0 leading-6">{children}</div>
    </div>
  );
};
