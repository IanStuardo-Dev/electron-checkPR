import type { AzureConnectionConfig, PullRequest } from '../../types/azure';
import { AZURE_API_VERSION, getAzureConfig, requestAzureJson } from './azure.api';
import type { AzurePullRequestResponse } from './azure.types';

function normalizeBranchName(branchRef: string): string {
  return branchRef.replace('refs/heads/', '');
}

export async function getAzurePullRequests(config: AzureConnectionConfig): Promise<PullRequest[]> {
  const { organization, project, personalAccessToken } = getAzureConfig(config);

  if (!organization || !project || !personalAccessToken) {
    throw new Error('Organization, project, and personal access token are required.');
  }

  const query = new URLSearchParams({
    'searchCriteria.status': 'active',
    '$top': '100',
    'api-version': AZURE_API_VERSION,
  });

  if (config.repositoryId?.trim()) {
    query.set('searchCriteria.repositoryId', config.repositoryId.trim());
  }

  const pullRequests: PullRequest[] = [];
  let skip = 0;

  while (true) {
    query.set('$skip', String(skip));
    const requestUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/git/pullrequests?${query.toString()}`;
    const payload = await requestAzureJson<AzurePullRequestResponse>(requestUrl, personalAccessToken, 'pull requests request');

    pullRequests.push(...payload.value.map((pr) => ({
      id: pr.pullRequestId,
      title: pr.title,
      description: pr.description || 'No description provided.',
      status: pr.status,
      repository: pr.repository?.name || 'Unknown repository',
      createdAt: pr.creationDate,
      sourceBranch: normalizeBranchName(pr.sourceRefName),
      targetBranch: normalizeBranchName(pr.targetRefName),
      url: pr.repository?.webUrl
        ? `${pr.repository.webUrl}/pullrequest/${pr.pullRequestId}`
        : pr.url,
      isDraft: Boolean(pr.isDraft),
      mergeStatus: pr.mergeStatus || 'unknown',
      createdBy: {
        displayName: pr.createdBy?.displayName || 'Unknown author',
        uniqueName: pr.createdBy?.uniqueName,
        imageUrl: pr.createdBy?.imageUrl,
      },
      reviewers: (pr.reviewers || []).map((reviewer) => ({
        displayName: reviewer.displayName,
        uniqueName: reviewer.uniqueName,
        vote: reviewer.vote,
        isRequired: reviewer.isRequired,
      })),
    })));

    if (payload.value.length < 100) {
      break;
    }

    skip += 100;
  }

  return pullRequests;
}
