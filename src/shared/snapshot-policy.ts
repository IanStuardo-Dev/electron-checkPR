export interface SnapshotPathExclusionMetrics {
  omittedByPrioritization: string[];
  omittedBySize: string[];
  omittedByBinaryDetection: string[];
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

export function mergeExcludedPathPatterns(...patternBlocks: Array<string | undefined>): string {
  const merged = Array.from(new Set(
    patternBlocks.flatMap((block) => parseExcludedPathPatterns(block)),
  ));

  return merged.join('\n');
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
