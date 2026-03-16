import type { RepositoryAnalysisRequest, RepositoryAnalysisResult, RepositorySnapshotPreview } from '../../../../types/analysis';
import { invokeIpcResponse } from '../../../shared/electron/ipcResponse';

export async function previewRepositorySnapshot(payload: RepositoryAnalysisRequest): Promise<RepositorySnapshotPreview> {
  return invokeIpcResponse<RepositorySnapshotPreview>('analysis:previewRepositorySnapshot', payload);
}

export async function runRepositoryAnalysis(payload: RepositoryAnalysisRequest): Promise<RepositoryAnalysisResult> {
  return invokeIpcResponse<RepositoryAnalysisResult>('analysis:runRepositoryAnalysis', payload);
}

export async function cancelRepositoryAnalysis(requestId: string): Promise<void> {
  await invokeIpcResponse<void>('analysis:cancelRepositoryAnalysis', requestId);
}
