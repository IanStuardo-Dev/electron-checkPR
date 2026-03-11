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
