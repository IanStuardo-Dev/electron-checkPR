const ALLOWED_EXTERNAL_HOSTS = new Set([
  'dev.azure.com',
  'github.com',
  'gitlab.com',
]);

function isAllowedExternalHost(hostname: string): boolean {
  return ALLOWED_EXTERNAL_HOSTS.has(hostname) || hostname.endsWith('.visualstudio.com');
}

export function validateExternalUrl(rawUrl: string): string {
  if (!rawUrl) {
    throw new Error('A valid URL is required.');
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('La URL externa no es valida.');
  }

  if (url.protocol !== 'https:') {
    throw new Error('Solo se permiten URLs externas con https.');
  }

  if (!isAllowedExternalHost(url.hostname)) {
    throw new Error(`El host ${url.hostname} no esta permitido para abrir enlaces externos.`);
  }

  return url.toString();
}
