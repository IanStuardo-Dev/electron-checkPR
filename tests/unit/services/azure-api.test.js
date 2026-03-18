const azureApi = require('../../../src/services/azure/azure.api');

describe('azure api helpers', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  test('normalizeOrganization y normalizeProject soportan URLs y hosts legacy', () => {
    expect(azureApi.normalizeOrganization('https://dev.azure.com/acme/platform/')).toBe('acme');
    expect(azureApi.normalizeOrganization('acme.visualstudio.com')).toBe('acme');
    expect(azureApi.normalizeProject('https://dev.azure.com/acme/platform/_git/repo-a')).toBe('platform');
    expect(azureApi.normalizeProject('/platform/')).toBe('platform');
    expect(azureApi.normalizeOrganization('https://%zz')).toBe('https://%zz');
    expect(azureApi.normalizeProject('https://%zz')).toBe('https://%zz');
    expect(azureApi.normalizeOrganization('https://dev.azure.com')).toBe('https://dev.azure.com');
    expect(azureApi.normalizeProject('https://dev.azure.com/acme')).toBe('acme');
    expect(azureApi.normalizeProject('https://dev.azure.com')).toBe('https://dev.azure.com');
  });

  test('getAzureConfig trimmea y normaliza el contexto', () => {
    expect(azureApi.getAzureConfig({
      organization: ' https://dev.azure.com/acme/ ',
      project: ' /platform/ ',
      personalAccessToken: ' pat ',
    })).toEqual({
      organization: 'acme',
      project: 'platform',
      personalAccessToken: 'pat',
    });
  });

  test('getAzureContinuationToken lee el header cuando existe', () => {
    expect(azureApi.getAzureContinuationToken(new Headers({
      'x-ms-continuationtoken': 'next-page',
    }))).toBe('next-page');

    expect(azureApi.getAzureContinuationToken(new Headers())).toBeNull();
  });

  test('requestAzureJsonResponse devuelve data y headers', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({ value: [] }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'x-ms-continuationtoken': 'page-2',
      },
    }));

    const result = await azureApi.requestAzureJsonResponse('https://dev.azure.com/acme/_apis/projects', 'pat', 'projects request');

    expect(result.data).toEqual({ value: [] });
    expect(result.headers.get('x-ms-continuationtoken')).toBe('page-2');
  });

  test('requestAzureText reporta errores 401 y genericos', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(new Response('Unauthorized', {
        status: 401,
        headers: { 'content-type': 'text/plain' },
      }))
      .mockResolvedValueOnce(new Response('', {
        status: 500,
        statusText: 'Server Error',
        headers: { 'content-type': 'text/plain' },
      }));

    await expect(azureApi.requestAzureText('https://dev.azure.com/acme/file', 'pat', 'item content request'))
      .rejects.toThrow('failed (401): unauthorized');

    await expect(azureApi.requestAzureText('https://dev.azure.com/acme/file', 'pat', 'item content request'))
      .rejects.toThrow('failed (500): Server Error');
  });
});
