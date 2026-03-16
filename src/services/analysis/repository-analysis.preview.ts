import type { RepositorySnapshot, RepositorySnapshotPreview } from '../../types/analysis';
import { buildSnapshotSensitivitySummary } from '../shared/snapshot-content';

export function buildRepositoryAnalysisPreview(snapshot: RepositorySnapshot): RepositorySnapshotPreview {
  const sensitivity = buildSnapshotSensitivitySummary(snapshot.files);

  return {
    provider: snapshot.provider,
    repository: snapshot.repository,
    branch: snapshot.branch,
    includedFiles: snapshot.files.slice(0, 8).map((file) => file.path),
    filesPrepared: snapshot.files.length,
    totalFilesDiscovered: snapshot.totalFilesDiscovered,
    truncated: snapshot.truncated,
    partialReason: snapshot.partialReason,
    exclusions: snapshot.exclusions ?? {
      omittedByPrioritization: [],
      omittedBySize: [],
      omittedByBinaryDetection: [],
    },
    sensitivity,
    disclaimer: 'Se enviara a Codex el contenido textual del snapshot preparado para este repositorio y rama. Revisa los archivos incluidos, las exclusiones y las alertas de sensibilidad antes de continuar.',
    metrics: snapshot.metrics,
  };
}
