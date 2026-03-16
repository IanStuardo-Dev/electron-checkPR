interface JsonResponseOptions {
  providerLabel: string;
  context: string;
  unauthorizedHint?: string;
  forbiddenHint?: string;
  invalidJsonHint?: string;
}

function buildResponsePreview(responseText: string): string {
  return responseText.replace(/\s+/g, ' ').trim().slice(0, 280);
}

export async function readJsonResponse<T>(
  response: Response,
  options: JsonResponseOptions,
): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();
  const responsePreview = buildResponsePreview(responseText);

  if (!response.ok) {
    const detail = responsePreview || response.statusText;

    if (response.status === 401) {
      throw new Error(`${options.providerLabel} ${options.context} failed (401): unauthorized.${options.unauthorizedHint ? ` ${options.unauthorizedHint}` : ''} Response: ${detail || 'empty body'}`);
    }

    if (response.status === 403) {
      throw new Error(`${options.providerLabel} ${options.context} failed (403): forbidden.${options.forbiddenHint ? ` ${options.forbiddenHint}` : ''} Response: ${detail || 'empty body'}`);
    }

    throw new Error(`${options.providerLabel} ${options.context} failed (${response.status}): ${detail}`);
  }

  if (!contentType.includes('application/json')) {
    throw new Error(`${options.providerLabel} ${options.context} returned unexpected content (${contentType || 'unknown'}). Response: ${responsePreview || 'empty body'}`);
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(`${options.providerLabel} ${options.context} returned invalid JSON.${options.invalidJsonHint ? ` ${options.invalidJsonHint}` : ''}`);
  }
}
