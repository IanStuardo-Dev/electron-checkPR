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
