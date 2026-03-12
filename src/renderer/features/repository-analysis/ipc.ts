import type { RepositoryAnalysisRequest, RepositoryAnalysisResult, RepositorySnapshotPreview } from '../../../types/analysis';

interface IpcSuccessResponse<T> {
  ok: true;
  data: T;
}

interface IpcErrorResponse {
  ok: false;
  error: string;
}

type IpcResponse<T> = IpcSuccessResponse<T> | IpcErrorResponse;

export async function previewRepositorySnapshot(payload: RepositoryAnalysisRequest): Promise<RepositorySnapshotPreview> {
  const response = await window.electronApi.invoke('analysis:previewRepositorySnapshot', payload) as IpcResponse<RepositorySnapshotPreview>;

  if (!response.ok) {
    throw new Error(response.error);
  }

  return response.data;
}

export async function runRepositoryAnalysis(payload: RepositoryAnalysisRequest): Promise<RepositoryAnalysisResult> {
  const response = await window.electronApi.invoke('analysis:runRepositoryAnalysis', payload) as IpcResponse<RepositoryAnalysisResult>;

  if (!response.ok) {
    throw new Error(response.error);
  }

  return response.data;
}

export async function cancelRepositoryAnalysis(requestId: string): Promise<void> {
  const response = await window.electronApi.invoke('analysis:cancelRepositoryAnalysis', requestId) as IpcResponse<void>;

  if (!response.ok) {
    throw new Error(response.error);
  }
}
