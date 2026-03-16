import React from 'react';
import type { RepositoryAnalysisScopeFormProps } from './RepositoryAnalysisForm.types';
import { RepositoryAnalysisScopeSelectors } from './RepositoryAnalysisScopeSelectors';
import { RepositoryAnalysisSnapshotPreview } from './RepositoryAnalysisSnapshotPreview';

export const RepositoryAnalysisScopeForm = ({
  repositories,
  repositoryId,
  branchName,
  branches,
  isConnectionReady,
  isLoadingBranches,
  isRunning,
  branchError,
  selectedRepositoryName,
  providerLabel,
  model,
  maxFiles,
  activeDirectives,
  canPreparePreview,
  canRunAnalysis,
  preview,
  strictModeEnabled,
  strictModeBlocked,
  pendingExcludedPaths,
  snapshotAcknowledged,
  onToggleExcludedPath,
  onRegenerateWithExclusions,
  onToggleAcknowledgement,
  isPreviewing,
  isCancelling,
  resultVisible,
  onRepositoryChange,
  onBranchChange,
  onPreparePreview,
  onRun,
  onCancel,
  onReset,
}: RepositoryAnalysisScopeFormProps) => (
  <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
    <RepositoryAnalysisScopeSelectors
      repositories={repositories}
      repositoryId={repositoryId}
      branchName={branchName}
      branches={branches}
      isConnectionReady={isConnectionReady}
      isLoadingBranches={isLoadingBranches}
      isRunning={isRunning}
      branchError={branchError}
      selectedRepositoryName={selectedRepositoryName}
      providerLabel={providerLabel}
      model={model}
      maxFiles={maxFiles}
      activeDirectives={activeDirectives}
      canPreparePreview={canPreparePreview}
      canRunAnalysis={canRunAnalysis}
      isPreviewing={isPreviewing}
      isCancelling={isCancelling}
      resultVisible={resultVisible}
      onRepositoryChange={onRepositoryChange}
      onBranchChange={onBranchChange}
      onPreparePreview={onPreparePreview}
      onRun={onRun}
      onCancel={onCancel}
      onReset={onReset}
    />

    <RepositoryAnalysisSnapshotPreview
      preview={preview}
      strictModeEnabled={strictModeEnabled}
      strictModeBlocked={strictModeBlocked}
      pendingExcludedPaths={pendingExcludedPaths}
      snapshotAcknowledged={snapshotAcknowledged}
      onToggleExcludedPath={onToggleExcludedPath}
      onRegenerateWithExclusions={onRegenerateWithExclusions}
      onToggleAcknowledgement={onToggleAcknowledgement}
      isPreviewing={isPreviewing}
      isRunning={isRunning}
    />
  </section>
);
