import type { AzureConnectionConfig } from '../../types/azure';
import { readJsonResponse } from '../../shared/http-response';

const AZURE_API_VERSION = '7.1';

function encodePat(personalAccessToken: string): string {
  return Buffer.from(`:${personalAccessToken}`).toString('base64');
}

export function normalizeOrganization(rawOrganization: string): string {
  const trimmed = rawOrganization.trim().replace(/\/+$/, '');

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const [firstSegment] = url.pathname.split('/').filter(Boolean);
      return firstSegment || trimmed;
    } catch {
      return trimmed;
    }
  }

  return trimmed
    .replace(/^dev\.azure\.com\//, '')
    .replace(/\.visualstudio\.com$/, '');
}

export function normalizeProject(rawProject: string): string {
  const trimmed = rawProject.trim().replace(/^\/+|\/+$/g, '');

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const segments = url.pathname.split('/').filter(Boolean);
      return segments[1] || segments[0] || trimmed;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

export function getAzureConfig(config: AzureConnectionConfig): Required<Pick<AzureConnectionConfig, 'organization' | 'project' | 'personalAccessToken'>> {
  return {
    organization: normalizeOrganization(config.organization),
    project: normalizeProject(config.project),
    personalAccessToken: config.personalAccessToken.trim(),
  };
}

export function getAzureContinuationToken(headers: Headers): string | null {
  return headers.get('x-ms-continuationtoken');
}

export async function readAzureResponse<T>(response: Response, context: string): Promise<T> {
  return readJsonResponse<T>(response, {
    providerLabel: 'Azure DevOps',
    context,
    invalidJsonHint: 'Revisa organization/project y que el endpoint exista.',
  });
}

export async function requestAzureJson<T>(url: string, personalAccessToken: string, context: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${encodePat(personalAccessToken)}`,
      Accept: 'application/json',
    },
  });

  return readAzureResponse<T>(response, context);
}

export async function requestAzureJsonResponse<T>(
  url: string,
  personalAccessToken: string,
  context: string,
): Promise<{ data: T; headers: Headers }> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${encodePat(personalAccessToken)}`,
      Accept: 'application/json',
    },
  });

  return {
    data: await readAzureResponse<T>(response, context),
    headers: response.headers,
  };
}

export async function requestAzureText(url: string, personalAccessToken: string, context: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${encodePat(personalAccessToken)}`,
      Accept: 'text/plain, application/json',
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    const detail = responseText.replace(/\s+/g, ' ').trim().slice(0, 280) || response.statusText;

    if (response.status === 401) {
      throw new Error(`Azure DevOps ${context} failed (401): unauthorized. Response: ${detail || 'empty body'}`);
    }

    throw new Error(`Azure DevOps ${context} failed (${response.status}): ${detail}`);
  }

  return response.text();
}

export { AZURE_API_VERSION };
