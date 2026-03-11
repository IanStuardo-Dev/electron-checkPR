const { PullRequestService, pullRequestServiceInternals } = require('../src/services/azure/pr.service');

describe('PullRequestService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('normaliza organization y project desde URLs completas', () => {
    expect(pullRequestServiceInternals.normalizeOrganization('https://dev.azure.com/EsmaxDevelop/')).toBe('EsmaxDevelop');
    expect(pullRequestServiceInternals.normalizeProject('https://dev.azure.com/EsmaxDevelop/ProyectoUno/_git/repo')).toBe('ProyectoUno');
  });

  test('getProjects mapea la respuesta de Azure', async () => {
    const service = new PullRequestService();
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({
        value: [
          { id: '1', name: 'Core', state: 'wellFormed' },
          { id: '2', name: 'Payments', state: 'createPending' },
        ],
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const projects = await service.getProjects({
      provider: 'azure-devops',
      organization: 'https://dev.azure.com/EsmaxDevelop/',
      project: '',
      personalAccessToken: 'pat',
    });

    expect(projects).toEqual([
      { id: '1', name: 'Core', state: 'wellFormed' },
      { id: '2', name: 'Payments', state: 'createPending' },
    ]);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://dev.azure.com/EsmaxDevelop/_apis/projects'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      }),
    );
  });

  test('readAzureResponse devuelve mensaje claro en 401', async () => {
    const response = new Response('Unauthorized', {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });

    await expect(
      pullRequestServiceInternals.readAzureResponse(response, 'projects request'),
    ).rejects.toThrow('Azure DevOps projects request failed (401): unauthorized. Response: Unauthorized');
  });
});
