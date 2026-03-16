jest.mock('../../../src/services/azure/azure.api', () => ({
  getAzureConfig: jest.fn((config) => config),
}));

const { getRequiredAzureProjectContext, getRequiredAzureRepositoryContext } = require('../../../src/services/azure/azure.context');

describe('azure context helpers', () => {
  test('getRequiredAzureProjectContext devuelve el contexto cuando la config es valida', () => {
    expect(getRequiredAzureProjectContext({
      organization: 'org',
      project: 'proj',
      personalAccessToken: 'pat',
    })).toEqual({
      organization: 'org',
      project: 'proj',
      personalAccessToken: 'pat',
    });
  });

  test('getRequiredAzureProjectContext rechaza config incompleta', () => {
    expect(() => getRequiredAzureProjectContext({
      organization: 'org',
      project: '',
      personalAccessToken: 'pat',
    })).toThrow('Organization, project, and personal access token are required.');
  });

  test('getRequiredAzureRepositoryContext exige repositoryId', () => {
    expect(getRequiredAzureRepositoryContext({
      organization: 'org',
      project: 'proj',
      repositoryId: 'repo-a',
      personalAccessToken: 'pat',
    })).toEqual({
      organization: 'org',
      project: 'proj',
      repositoryId: 'repo-a',
      personalAccessToken: 'pat',
    });

    expect(() => getRequiredAzureRepositoryContext({
      organization: 'org',
      project: 'proj',
      repositoryId: '   ',
      personalAccessToken: 'pat',
    })).toThrow('Organization, project, repository, and personal access token are required.');
  });
});
