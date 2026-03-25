import type { RepositoryAnalysisRequest, RepositoryAnalysisResult, RepositorySnapshotPreview } from '../../../../types/analysis';
import { invokeBridgeResponse } from '../../../shared/electron/bridgeResponse';

export async function previewRepositorySnapshot(payload: RepositoryAnalysisRequest): Promise<RepositorySnapshotPreview> {
  return invokeBridgeResponse<RepositorySnapshotPreview>('analysis:previewRepositorySnapshot', payload);
}

export async function runRepositoryAnalysis(payload: RepositoryAnalysisRequest): Promise<RepositoryAnalysisResult> {
  return invokeBridgeResponse<RepositoryAnalysisResult>('analysis:runRepositoryAnalysis', payload);
}

export async function cancelRepositoryAnalysis(requestId: string): Promise<void> {
  await invokeBridgeResponse<void>('analysis:cancelRepositoryAnalysis', requestId);
}


