const { validateExternalUrl } = require('../../../src/modules/runtime-host/application/repository-source/services/external-link-policy.service');

describe('external links validation', () => {
  test('acepta hosts permitidos y https', () => {
    expect(validateExternalUrl('https://github.com/openai/openai')).toBe('https://github.com/openai/openai');
    expect(validateExternalUrl('https://org.visualstudio.com/project')).toContain('visualstudio.com');
  });

  test('rechaza urls invalidas, protocolos no seguros y hosts no permitidos', () => {
    expect(() => validateExternalUrl('')).toThrow('A valid URL is required.');
    expect(() => validateExternalUrl('notaurl')).toThrow('La URL externa no es valida.');
    expect(() => validateExternalUrl('http://github.com/acme/repo')).toThrow('Solo se permiten URLs externas con https.');
    expect(() => validateExternalUrl('https://evil.com/phish')).toThrow('no esta permitido');
  });
});




