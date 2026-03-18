import type { RepositoryConnectionConfig, ReviewItem, ReviewItemReviewer } from '../../types/repository';
import { mapWithConcurrency } from '../../shared/request-control';
import { getGitHubConfig, requestGitHubJson, requestGitHubPaginated } from './github.api';
import { getGitHubRepositories } from './github.repositories';
import type { GitHubPullRequestListResponseItem, GitHubReviewResponseItem } from './github.types';

function getReviewerVote(state: string): number {
  switch (state.toUpperCase()) {
    case 'APPROVED':
      return 10;
    case 'CHANGES_REQUESTED':
      return -10;
    default:
      return 0;
  }
}

async function getPullRequestReviewers(
  owner: string,
  repository: string,
  pullNumber: number,
  personalAccessToken: string,
  requestedReviewers: GitHubPullRequestListResponseItem['requested_reviewers'],
  assignees: GitHubPullRequestListResponseItem['assignees'],
): Promise<ReviewItemReviewer[]> {
  const reviews = await requestGitHubJson<GitHubReviewResponseItem[]>(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${pullNumber}/reviews?per_page=100`,
    personalAccessToken,
    `pull request reviews request (#${pullNumber})`,
  );

  const latestReviewByUser = new Map<string, GitHubReviewResponseItem>();
  reviews.forEach((review) => {
    if (review.user?.login) {
      latestReviewByUser.set(review.user.login, review);
    }
  });

  const reviewers = new Map<string, ReviewItemReviewer>();

  latestReviewByUser.forEach((review, login) => {
    reviewers.set(login, {
      displayName: login,
      uniqueName: login,
      vote: getReviewerVote(review.state),
      isRequired: false,
    });
  });

  (requestedReviewers || []).forEach((reviewer) => {
    reviewers.set(reviewer.login, {
      displayName: reviewer.login,
      uniqueName: reviewer.login,
      vote: reviewers.get(reviewer.login)?.vote ?? 0,
      isRequired: true,
    });
  });

  (assignees || []).forEach((assignee) => {
    if (!reviewers.has(assignee.login)) {
      reviewers.set(assignee.login, {
        displayName: assignee.login,
        uniqueName: assignee.login,
        vote: 0,
        isRequired: false,
      });
    }
  });

  return Array.from(reviewers.values());
}

export async function getGitHubPullRequests(config: RepositoryConnectionConfig): Promise<ReviewItem[]> {
  const { organization, personalAccessToken, repository } = getGitHubConfig(config);

  if (!organization || !personalAccessToken) {
    throw new Error('Owner/organization y token son obligatorios para GitHub.');
  }

  const targetRepositories = repository
    ? [{ id: repository, name: repository }]
    : await getGitHubRepositories(config);

  const reviewItems = await Promise.all(
    targetRepositories.map(async (targetRepository) => {
      const pullRequests = await requestGitHubPaginated<GitHubPullRequestListResponseItem>(
        `https://api.github.com/repos/${encodeURIComponent(organization)}/${encodeURIComponent(targetRepository.name)}/pulls?state=open&per_page=50&sort=created&direction=desc`,
        personalAccessToken,
        `pull requests request (${targetRepository.name})`,
      );

      return mapWithConcurrency(pullRequests, 5, async (pullRequest) => {
        const reviewers = await getPullRequestReviewers(
          organization,
          targetRepository.name,
          pullRequest.number,
          personalAccessToken,
          pullRequest.requested_reviewers,
          pullRequest.assignees,
        );

        return {
          id: pullRequest.number,
          title: pullRequest.title,
          description: pullRequest.body || 'No description provided.',
          status: pullRequest.state,
          repository: targetRepository.name,
          createdAt: pullRequest.created_at,
          sourceBranch: pullRequest.head.ref,
          targetBranch: pullRequest.base.ref,
          url: pullRequest.html_url,
          isDraft: Boolean(pullRequest.draft),
          mergeStatus: 'unknown',
          createdBy: {
            displayName: pullRequest.user?.login || 'Unknown author',
            uniqueName: pullRequest.user?.login,
            imageUrl: pullRequest.user?.avatar_url,
          },
          reviewers,
        } satisfies ReviewItem;
      });
    }),
  );

  return reviewItems.flat().sort((left, right) =>
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}
