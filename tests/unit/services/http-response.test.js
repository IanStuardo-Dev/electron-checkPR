const { readJsonResponse } = require('../../../src/shared/http-response');

describe('readJsonResponse', () => {
  test('parsea JSON valido cuando la respuesta es correcta', async () => {
    await expect(readJsonResponse(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }), {
      providerLabel: 'GitHub',
      context: 'projects request',
    })).resolves.toEqual({ ok: true });
  });

  test('incluye unauthorizedHint en errores 401', async () => {
    await expect(readJsonResponse(new Response('Unauthorized', {
      status: 401,
      headers: { 'content-type': 'text/plain' },
    }), {
      providerLabel: 'GitHub',
      context: 'projects request',
      unauthorizedHint: 'Revisa el token.',
    })).rejects.toThrow('unauthorized. Revisa el token.');
  });

  test('maneja errores 401/403 sin hint y contenido desconocido sin body', async () => {
    await expect(readJsonResponse(new Response('', {
      status: 401,
      statusText: 'Unauthorized',
    }), {
      providerLabel: 'GitHub',
      context: 'projects request',
    })).rejects.toThrow('unauthorized. Response: Unauthorized');

    await expect(readJsonResponse(new Response('', {
      status: 403,
      statusText: 'Forbidden',
    }), {
      providerLabel: 'GitLab',
      context: 'projects request',
    })).rejects.toThrow('forbidden. Response: Forbidden');

    const unknownContentResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => null },
      text: async () => '',
    };

    await expect(readJsonResponse(unknownContentResponse, {
      providerLabel: 'Azure DevOps',
      context: 'projects request',
    })).rejects.toThrow('unexpected content (unknown). Response: empty body');
  });

  test('incluye forbiddenHint en errores 403', async () => {
    await expect(readJsonResponse(new Response('Forbidden', {
      status: 403,
      headers: { 'content-type': 'text/plain' },
    }), {
      providerLabel: 'GitLab',
      context: 'projects request',
      forbiddenHint: 'Revisa scopes del token.',
    })).rejects.toThrow('forbidden. Revisa scopes del token.');
  });

  test('rechaza contenido inesperado y JSON invalido', async () => {
    await expect(readJsonResponse(new Response('<html></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }), {
      providerLabel: 'Azure DevOps',
      context: 'projects request',
    })).rejects.toThrow('unexpected content');

    await expect(readJsonResponse(new Response('{invalid', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }), {
      providerLabel: 'Azure DevOps',
      context: 'projects request',
      invalidJsonHint: 'Revisa organization/project.',
    })).rejects.toThrow('returned invalid JSON. Revisa organization/project.');

    await expect(readJsonResponse(new Response('{invalid', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }), {
      providerLabel: 'GitHub',
      context: 'projects request',
    })).rejects.toThrow('GitHub projects request returned invalid JSON.');
  });

  test('usa el statusText en errores genericos cuando el body viene vacio', async () => {
    await expect(readJsonResponse(new Response('', {
      status: 500,
      statusText: 'Server Error',
      headers: { 'content-type': 'application/json' },
    }), {
      providerLabel: 'GitHub',
      context: 'projects request',
    })).rejects.toThrow('failed (500): Server Error');
  });
});
