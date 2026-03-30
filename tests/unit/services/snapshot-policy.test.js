const {
  mergeExcludedPathPatterns,
  parseExcludedPathPatterns,
  shouldExcludeSnapshotPath,
} = require('../../../src/shared/snapshot-policy');

describe('snapshot-policy', () => {
  test('parseExcludedPathPatterns recorta espacios y limita la lista a 100 entradas', () => {
    const rawPatterns = Array.from({ length: 120 }, (_, index) => ` pattern-${index} `).join('\n');
    const parsed = parseExcludedPathPatterns(rawPatterns);

    expect(parsed).toHaveLength(100);
    expect(parsed[0]).toBe('pattern-0');
    expect(parsed[99]).toBe('pattern-99');
  });

  test('mergeExcludedPathPatterns deduplica y mantiene orden de aparicion', () => {
    const merged = mergeExcludedPathPatterns(
      '.env\nnode_modules/**\n*.pem',
      'node_modules/**\n dist/** ',
      undefined,
    );

    expect(merged).toBe([
      '.env',
      'node_modules/**',
      '*.pem',
      'dist/**',
    ].join('\n'));
  });

  test('shouldExcludeSnapshotPath soporta normalizacion de slash inicial y matching case-insensitive', () => {
    const patterns = 'config/*.json\nsrc/**/secrets.ts';

    expect(shouldExcludeSnapshotPath('/config/APP.JSON', patterns)).toBe(true);
    expect(shouldExcludeSnapshotPath('src/core/security/secrets.ts', patterns)).toBe(true);
  });

  test('shouldExcludeSnapshotPath respeta borde estricto de path', () => {
    const pattern = 'config/.env';

    expect(shouldExcludeSnapshotPath('config/.env', pattern)).toBe(true);
    expect(shouldExcludeSnapshotPath('config/.env.backup', pattern)).toBe(false);
  });

  test('shouldExcludeSnapshotPath no excluye archivos fuera del scope del glob', () => {
    expect(shouldExcludeSnapshotPath('src/app.ts', '*.pem\ncoverage/**')).toBe(false);
  });
});
