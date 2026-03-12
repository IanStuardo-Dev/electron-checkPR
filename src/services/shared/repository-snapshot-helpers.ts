const SUPPORTED_CODE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'json', 'py', 'java', 'kt', 'go', 'rb', 'php', 'cs', 'swift',
  'scala', 'rs', 'c', 'cc', 'cpp', 'h', 'hpp', 'm', 'mm', 'sql', 'yml', 'yaml', 'toml',
  'sh', 'bash', 'zsh', 'md',
]);

export function isTestFile(path: string): boolean {
  return /(^|\/)(test|tests|__tests__|spec|specs)(\/|$)|\.(spec|test)\./i.test(path);
}

export function isSupportedCodeFile(path: string): boolean {
  const extension = path.split('.').pop()?.toLowerCase() || '';
  return SUPPORTED_CODE_EXTENSIONS.has(extension);
}

export function rankPath(path: string): number {
  if (/auth|security|permission|payment|billing|token|secret/i.test(path)) {
    return 4;
  }
  if (/src|app|server|api|core/i.test(path)) {
    return 3;
  }
  if (/config|infra|deploy/i.test(path)) {
    return 2;
  }
  return 1;
}

export function parseExcludedPathPatterns(rawPatterns?: string): string[] {
  if (!rawPatterns) {
    return [];
  }

  return rawPatterns
    .split('\n')
    .map((pattern) => pattern.trim())
    .filter(Boolean)
    .slice(0, 100);
}

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '::DOUBLE_STAR::')
    .replace(/\*/g, '[^/]*')
    .replace(/::DOUBLE_STAR::/g, '.*');

  return new RegExp(`(^|/)${escaped}$`, 'i');
}

export function shouldExcludeSnapshotPath(path: string, rawPatterns?: string): boolean {
  const normalizedPath = path.replace(/^\/+/, '');
  const patterns = parseExcludedPathPatterns(rawPatterns);

  return patterns.some((pattern) => globToRegExp(pattern).test(normalizedPath));
}
