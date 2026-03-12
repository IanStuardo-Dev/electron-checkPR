import type { RepositoryFileSnapshot, RepositorySnapshotSensitivitySummary } from '../../types/analysis';

export const MAX_SNAPSHOT_FILE_BYTES = 300 * 1024;

export function isProbablyBinaryContent(content: string): boolean {
  if (!content) {
    return false;
  }

  const sample = content.slice(0, 4096);
  let suspiciousChars = 0;

  for (let index = 0; index < sample.length; index += 1) {
    const code = sample.charCodeAt(index);

    if (code === 0) {
      return true;
    }

    const isPrintableAscii = code >= 32 && code <= 126;
    const isCommonWhitespace = code === 9 || code === 10 || code === 13;

    if (!isPrintableAscii && !isCommonWhitespace) {
      suspiciousChars += 1;
    }
  }

  return suspiciousChars / sample.length > 0.1;
}

export function appendPartialReason(baseReason: string | undefined, fragments: string[]): string | undefined {
  const normalized = fragments.filter(Boolean);

  if (baseReason) {
    normalized.unshift(baseReason);
  }

  if (normalized.length === 0) {
    return undefined;
  }

  return normalized.join(' ');
}

const SENSITIVE_CONFIG_PATH_PATTERNS = [
  /(^|\/)\.env(\.|$)/i,
  /(^|\/)appsettings(\.[^.]+)?\.json$/i,
  /(^|\/)application\.(ya?ml|properties)$/i,
  /(^|\/)(secrets?|credentials?)\.(json|ya?ml|env|txt)$/i,
  /(^|\/)terraform\.tfvars$/i,
  /(^|\/)\.npmrc$/i,
  /(^|\/)\.pypirc$/i,
  /(^|\/)docker-compose\.(ya?ml)$/i,
  /(^|\/)values\.(ya?ml)$/i,
];

const SECRET_CONTENT_PATTERNS: Array<{ pattern: RegExp; reason: string; confidence: 'medium' | 'high' }> = [
  { pattern: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/, reason: 'contiene una clave privada en texto plano', confidence: 'high' },
  { pattern: /\b(api[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token|password|passwd|secret)\b\s*[:=]\s*['"]?[A-Za-z0-9_\-\/+=:.]{8,}/i, reason: 'incluye un posible secreto hardcodeado', confidence: 'high' },
  { pattern: /\b(ghp_[A-Za-z0-9]{20,}|glpat-[A-Za-z0-9\-_]{20,}|azdpat[a-z0-9]{10,})\b/i, reason: 'incluye un token con formato conocido', confidence: 'high' },
  { pattern: /AKIA[0-9A-Z]{16}/, reason: 'incluye una clave con formato de credencial cloud', confidence: 'high' },
  { pattern: /(?:mongodb|postgres(?:ql)?|mysql|redis):\/\/[^ \n]+:[^ \n]+@/i, reason: 'incluye una connection string con credenciales', confidence: 'high' },
  { pattern: /Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+/, reason: 'incluye un bearer token o JWT embebido', confidence: 'medium' },
];

export function buildSnapshotSensitivitySummary(files: RepositoryFileSnapshot[]): RepositorySnapshotSensitivitySummary {
  const findings: RepositorySnapshotSensitivitySummary['findings'] = [];
  const seenPaths = new Set<string>();
  let hasSensitiveConfigFiles = false;
  let hasSecretPatterns = false;

  files.forEach((file) => {
    if (SENSITIVE_CONFIG_PATH_PATTERNS.some((pattern) => pattern.test(file.path))) {
      hasSensitiveConfigFiles = true;

      if (!seenPaths.has(`config:${file.path}`) && findings.length < 10) {
        seenPaths.add(`config:${file.path}`);
        findings.push({
          kind: 'sensitive-config',
          path: file.path,
          reason: 'el nombre del archivo sugiere configuracion o credenciales potencialmente sensibles',
          confidence: 'medium',
        });
      }
    }

    for (const matcher of SECRET_CONTENT_PATTERNS) {
      if (matcher.pattern.test(file.content)) {
        hasSecretPatterns = true;

        if (!seenPaths.has(`secret:${file.path}`) && findings.length < 10) {
          seenPaths.add(`secret:${file.path}`);
          findings.push({
            kind: 'secret-pattern',
            path: file.path,
            reason: matcher.reason,
            confidence: matcher.confidence,
          });
        }
        break;
      }
    }
  });

  const noSensitiveConfigFilesDetected = !hasSensitiveConfigFiles;
  const summary = hasSecretPatterns
    ? 'Se detectaron patrones que podrian exponer secretos o credenciales dentro del snapshot preparado.'
    : hasSensitiveConfigFiles
      ? 'Hay archivos de configuracion potencialmente sensibles en el snapshot, aunque no se detectaron secretos evidentes por patron.'
      : 'No se detectaron archivos sensibles de configuracion ni patrones evidentes de secretos en el snapshot preparado.';

  return {
    findings,
    hasSensitiveConfigFiles,
    hasSecretPatterns,
    noSensitiveConfigFilesDetected,
    summary,
  };
}
