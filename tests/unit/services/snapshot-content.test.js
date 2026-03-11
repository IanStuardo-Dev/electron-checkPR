const {
  MAX_SNAPSHOT_FILE_BYTES,
  appendPartialReason,
  isProbablyBinaryContent,
} = require('../../../src/services/shared/snapshot-content');

describe('snapshot-content', () => {
  test('expone el limite maximo esperado por archivo', () => {
    expect(MAX_SNAPSHOT_FILE_BYTES).toBe(300 * 1024);
  });

  test('isProbablyBinaryContent detecta null bytes y caracteres sospechosos', () => {
    expect(isProbablyBinaryContent('plain text file')).toBe(false);
    expect(isProbablyBinaryContent('')).toBe(false);
    expect(isProbablyBinaryContent(`abc${String.fromCharCode(0)}def`)).toBe(true);
    expect(isProbablyBinaryContent(`abc${String.fromCharCode(1)}${String.fromCharCode(2)}${String.fromCharCode(3)}${String.fromCharCode(4)}${String.fromCharCode(5)}${String.fromCharCode(6)}${String.fromCharCode(7)}${String.fromCharCode(8)}${String.fromCharCode(11)}zzzzzzzzzz`)).toBe(true);
  });

  test('appendPartialReason concatena fragmentos validos y evita undefined inutil', () => {
    expect(appendPartialReason(undefined, [])).toBeUndefined();
    expect(appendPartialReason(undefined, ['uno', '', 'dos'])).toBe('uno dos');
    expect(appendPartialReason('base', ['uno', 'dos'])).toBe('base uno dos');
  });
});
