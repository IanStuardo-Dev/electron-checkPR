import type { PullRequestAnalysisPreview, PullRequestChangedFileSnapshot, PullRequestSnapshot } from '../../types/analysis';
import { buildSnapshotSensitivitySummary } from '../shared/snapshot-content';

function toSensitivityFile(file: PullRequestChangedFileSnapshot) {
  return {
    path: file.path,
    extension: file.path.split('.').pop()?.toLowerCase() || '',
    size: file.patch?.length || 0,
    content: file.patch || '',
  };
}

export function buildPullRequestAnalysisPreview(
  snapshot: PullRequestSnapshot,
  strictMode: boolean,
): PullRequestAnalysisPreview {
  const textFiles = snapshot.files
    .filter((file) => file.patch)
    .map(toSensitivityFile);
  const metadataSensitivity = buildSnapshotSensitivitySummary(
    snapshot.files.map((file) => ({
      ...toSensitivityFile(file),
      content: '',
    })),
  );
  const patchSensitivity = buildSnapshotSensitivitySummary(textFiles);
  const lacksPatchCoverage = textFiles.length === 0;
  const hasIncompletePatchCoverage = snapshot.files.length > textFiles.length;

  return {
    pullRequestId: snapshot.pullRequestId,
    repository: snapshot.repository,
    title: snapshot.title,
    filesPrepared: snapshot.files.length,
    totalFilesChanged: snapshot.totalFilesChanged,
    includedFiles: snapshot.files.slice(0, 8).map((file) => file.path),
    truncated: snapshot.truncated,
    partialReason: snapshot.partialReason,
    sensitivity: {
      findings: [
        ...metadataSensitivity.findings,
        ...patchSensitivity.findings.filter((finding) => !metadataSensitivity.findings.some((metadataFinding) => (
          metadataFinding.kind === finding.kind && metadataFinding.path === finding.path
        ))),
      ].slice(0, 10),
      hasSensitiveConfigFiles: metadataSensitivity.hasSensitiveConfigFiles || patchSensitivity.hasSensitiveConfigFiles,
      hasSecretPatterns: patchSensitivity.hasSecretPatterns,
      noSensitiveConfigFilesDetected: metadataSensitivity.noSensitiveConfigFilesDetected && patchSensitivity.noSensitiveConfigFilesDetected,
      summary: lacksPatchCoverage
        ? 'El provider no entrego diff textual suficiente para este PR. No se enviara automaticamente a Codex.'
        : patchSensitivity.summary,
    },
    disclaimer: strictMode
      ? 'Revisa este snapshot antes de enviar a Codex. En modo estricto se bloqueara el envio si hay sensibilidad o cobertura incompleta.'
      : 'Revisa este snapshot local antes de decidir si quieres enviarlo a Codex para analisis IA.',
    lacksPatchCoverage,
    strictModeWouldBlock: strictMode && (
      lacksPatchCoverage
      || hasIncompletePatchCoverage
      || patchSensitivity.hasSecretPatterns
      || patchSensitivity.hasSensitiveConfigFiles
      || metadataSensitivity.hasSensitiveConfigFiles
    ),
  };
}
