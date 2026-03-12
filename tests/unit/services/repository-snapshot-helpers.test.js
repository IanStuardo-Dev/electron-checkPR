const {
  parseExcludedPathPatterns,
  shouldExcludeSnapshotPath,
} = require('../../../src/services/shared/repository-snapshot-helpers');

describe('repository-snapshot-helpers', () => {
  test('parseExcludedPathPatterns normaliza patrones multilinea', () => {
    expect(parseExcludedPathPatterns('.env\n\n dist/** \n*.pem')).toEqual([
      '.env',
      'dist/**',
      '*.pem',
    ]);
  });

  test('shouldExcludeSnapshotPath soporta globs simples y dobles', () => {
    const patterns = '.env\nnode_modules/**\n*.pem\ndist/**';

    expect(shouldExcludeSnapshotPath('.env', patterns)).toBe(true);
    expect(shouldExcludeSnapshotPath('node_modules/react/index.js', patterns)).toBe(true);
    expect(shouldExcludeSnapshotPath('certs/server.pem', patterns)).toBe(true);
    expect(shouldExcludeSnapshotPath('dist/main.js', patterns)).toBe(true);
    expect(shouldExcludeSnapshotPath('src/app.ts', patterns)).toBe(false);
  });
});
