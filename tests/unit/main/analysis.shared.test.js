const {
  readRequiredString,
  normalizeProvider,
  normalizeOptionalString,
  clampNumber,
  readSnapshotPolicy,
} = require('../../../src/main/ipc/analysis.shared');

describe('analysis shared helpers', () => {
  test('readRequiredString exige strings con contenido', () => {
    expect(readRequiredString('  value  ', 'field')).toBe('value');
    expect(() => readRequiredString('', 'field')).toThrow('field es obligatorio.');
    expect(() => readRequiredString(null, 'field')).toThrow('field es obligatorio.');
  });

  test('normalizeProvider solo acepta providers soportados', () => {
    expect(normalizeProvider('azure-devops', 'provider')).toBe('azure-devops');
    expect(normalizeProvider('github', 'provider')).toBe('github');
    expect(normalizeProvider('gitlab', 'provider')).toBe('gitlab');
    expect(() => normalizeProvider('bitbucket', 'provider')).toThrow('provider no es valido.');
  });

  test('normalizeOptionalString y clampNumber aplican normalizacion defensiva', () => {
    expect(normalizeOptionalString(' reviewer@example.com ')).toBe('reviewer@example.com');
    expect(normalizeOptionalString('   ')).toBeUndefined();
    expect(clampNumber(250, 10, 200, 0)).toBe(200);
    expect(clampNumber(-4, 10, 200, 0)).toBe(10);
    expect(clampNumber('42.9', 10, 200, 0)).toBe(42);
    expect(clampNumber(undefined, 10, 200, 15)).toBe(15);
  });

  test('readSnapshotPolicy limita longitud y convierte strictMode a booleano', () => {
    const policy = readSnapshotPolicy({
      excludedPathPatterns: 'x'.repeat(4500),
      strictMode: 1,
    });

    expect(policy.excludedPathPatterns).toHaveLength(4000);
    expect(policy.strictMode).toBe(true);
    expect(readSnapshotPolicy(null)).toEqual({
      excludedPathPatterns: '',
      strictMode: false,
    });
  });
});
