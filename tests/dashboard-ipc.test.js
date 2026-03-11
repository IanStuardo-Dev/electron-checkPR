const { getProviderChannel } = require('../dist/renderer/features/dashboard/ipc.js');

describe('dashboard ipc provider mapping', () => {
  test('resuelve canales de Azure, GitHub y GitLab', () => {
    expect(getProviderChannel({
      provider: 'azure-devops',
      organization: '',
      project: '',
      personalAccessToken: '',
    }, 'pullRequests')).toBe('azure:fetchPullRequests');

    expect(getProviderChannel({
      provider: 'github',
      organization: '',
      project: '',
      personalAccessToken: '',
    }, 'repositories')).toBe('github:fetchRepositories');

    expect(getProviderChannel({
      provider: 'gitlab',
      organization: '',
      project: '',
      personalAccessToken: '',
    }, 'openExternal')).toBe('gitlab:openExternal');
  });
});
