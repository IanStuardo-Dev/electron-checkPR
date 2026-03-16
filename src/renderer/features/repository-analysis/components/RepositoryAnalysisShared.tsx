import React from 'react';
import { ArrowPathIcon, ShieldExclamationIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { countActiveArchitectureDirectives } from '../../../shared/codex/prompt-directives';

export function countActiveDirectives(config: {
  promptDirectives: {
    architectureReviewEnabled: boolean;
    architecturePattern: string;
    requiredPractices: string;
    forbiddenPractices: string;
    domainContext: string;
    customInstructions: string;
  };
}): number {
  return countActiveArchitectureDirectives(config.promptDirectives);
}

export const StatusRow = ({ label, value, ok }: { label: string; value: string; ok: boolean }) => (
  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
    <span>{label}</span>
    <span className={`font-medium ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>{value}</span>
  </div>
);

export const LoaderStep = ({ label, active, done }: { label: string; active: boolean; done: boolean }) => (
  <div className={`rounded-2xl border px-4 py-3 text-sm ${
    done
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : active
        ? 'border-sky-200 bg-sky-50 text-sky-700'
        : 'border-slate-200 bg-slate-50 text-slate-500'
  }`}>
    <div className="flex items-center gap-2">
      {done ? <ShieldExclamationIcon className="h-4 w-4" /> : active ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
      <span>{label}</span>
    </div>
  </div>
);

export const MetricCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
  </div>
);

export function formatDuration(durationMs?: number): string {
  if (!durationMs || durationMs <= 0) {
    return '-';
  }

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  return `${(durationMs / 1000).toFixed(1)} s`;
}

export function buildSnapshotSummary(result: {
  snapshot: {
    retryCount?: number;
    discardedByPrioritization?: number;
    discardedBySize?: number;
    discardedByBinaryDetection?: number;
  };
}): string {
  const retryCount = result.snapshot.retryCount ?? 0;
  const discardedByPrioritization = result.snapshot.discardedByPrioritization ?? 0;
  const discardedBySize = result.snapshot.discardedBySize ?? 0;
  const discardedByBinaryDetection = result.snapshot.discardedByBinaryDetection ?? 0;

  return `${retryCount} reintentos, ${discardedByPrioritization} por priorizacion, ${discardedBySize} por peso y ${discardedByBinaryDetection} por binario.`;
}

export function riskBadgeClass(value: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (value) {
    case 'critical':
      return 'bg-rose-100 text-rose-700';
    case 'high':
      return 'bg-amber-100 text-amber-700';
    case 'medium':
      return 'bg-sky-100 text-sky-700';
    default:
      return 'bg-emerald-100 text-emerald-700';
  }
}
