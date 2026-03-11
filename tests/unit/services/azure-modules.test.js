jest.mock('../../../src/services/azure/azure.api', () => ({
  AZURE_API_VERSION: '7.1',
  getAzureConfig: jest.fn((config) => config),
  getAzureContinuationToken: jest.fn(),
  requestAzureJson: jest.fn(),
  requestAzureJsonResponse: jest.fn(),
}));

const azureApi = require('../../../src/services/azure/azure.api');
const { getAzureProjects, getAzureRepositories, getAzureBranches } = require('../../../src/services/azure/azure.repositories');
const { getAzurePullRequests } = require('../../../src/services/azure/azure.pull-requests');

describe('azure modules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAzureProjects pagina con continuation token', async () => {
    azureApi.requestAzureJsonResponse
      .mockResolvedValueOnce({ data: { value: [{ id: '1', name: 'Core', state: 'active' }] }, headers: new Headers({ 'x-ms-continuationtoken': 'next' }) })
      .mockResolvedValueOnce({ data: { value: [{ id: '2', name: 'Payments', state: 'active' }] }, headers: new Headers() });
    azureApi.getAzureContinuationToken
      .mockReturnValueOnce('next')
      .mockReturnValueOnce(null);

    const projects = await getAzureProjects({ organization: 'org', personalAccessToken: 'pat' });

    expect(projects).toHaveLength(2);
    expect(azureApi.requestAzureJsonResponse).toHaveBeenCalledTimes(2);
  });

  test('getAzureRepositories y branches mapean payloads', async () => {
    azureApi.requestAzureJsonResponse.mockResolvedValue({
      data: {
        value: [{ id: 'repo', name: 'Repo', webUrl: 'https://dev.azure.com/org/proj/_git/repo', defaultBranch: 'refs/heads/main' }],
      },
      headers: new Headers(),
    });
    azureApi.getAzureContinuationToken.mockReturnValue(null);
    azureApi.requestAzureJson.mockResolvedValue({
      value: [{ name: 'refs/heads/main', objectId: '1' }],
    });

    const repositories = await getAzureRepositories({ organization: 'org', project: 'proj', personalAccessToken: 'pat' });
    const branches = await getAzureBranches({ organization: 'org', project: 'proj', repositoryId: 'repo', personalAccessToken: 'pat' });

    expect(repositories[0].name).toBe('Repo');
    expect(branches[0]).toEqual({ name: 'main', objectId: '1', isDefault: true });
  });

  test('getAzurePullRequests pagina con skip y normaliza ramas', async () => {
    azureApi.requestAzureJson
      .mockResolvedValueOnce({
        value: Array.from({ length: 100 }, (_, index) => ({
          pullRequestId: index + 1,
          title: `PR ${index + 1}`,
          description: '',
          status: 'active',
          creationDate: '2026-03-11T10:00:00.000Z',
          sourceRefName: 'refs/heads/feature/x',
          targetRefName: 'refs/heads/main',
          repository: { name: 'Repo', webUrl: 'https://dev.azure.com/org/proj/_git/repo' },
          createdBy: { displayName: 'Ian', uniqueName: 'ian' },
          reviewers: [],
        })),
      })
      .mockResolvedValueOnce({ value: [] });

    const prs = await getAzurePullRequests({ organization: 'org', project: 'proj', personalAccessToken: 'pat' });

    expect(prs).toHaveLength(100);
    expect(prs[0].sourceBranch).toBe('feature/x');
    expect(azureApi.requestAzureJson).toHaveBeenCalledTimes(2);
  });
});
