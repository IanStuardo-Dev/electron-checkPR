const {
  validateExternalUrl,
} = require('../../../src/modules/runtime-host/application/repository-source/services/external-link-policy.service');

describe('external link policy', () => {
  test('acepta hosts permitidos en https y normaliza host/puerto default', () => {
    expect(validateExternalUrl('https://GITHUB.com/OpenAI/openai')).toBe('https://github.com/OpenAI/openai');
    expect(validateExternalUrl('https://github.com:443/openai/openai')).toBe('https://github.com/openai/openai');
    expect(validateExternalUrl('https://org.visualstudio.com/project')).toBe('https://org.visualstudio.com/project');
  });

  test('rechaza hosts no permitidos aunque incluyan host valido como prefijo', () => {
    expect(() => validateExternalUrl('https://github.com.evil.com/phish')).toThrow('no esta permitido');
  });

  test('rechaza credenciales embebidas y puertos personalizados', () => {
    expect(() => validateExternalUrl('https://user:pass@github.com/openai/openai')).toThrow('credenciales embebidas');
    expect(() => validateExternalUrl('https://github.com:444/openai/openai')).toThrow('puerto personalizado');
  });
});
