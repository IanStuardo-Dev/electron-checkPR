import type { RepositoryConnectionConfig, ReviewItem, ReviewItemReviewer } from '../../types/repository';
import { GITLAB_API_BASE_URL, getGitLabConfig, requestGitLabJson, requestGitLabPaginated } from './gitlab.api';
import { getGitLabProjects } from './gitlab.repositories';
import type { GitLabApprovalsResponse, GitLabMergeRequestResponse, GitLabUserRef } from './gitlab.types';

function toReviewer(user: GitLabUserRef, vote: number, isRequired = false): ReviewItemReviewer {
  return {
    displayName: user.name || user.username,
    uniqueName: user.username,
    vote,
    isRequired,
  };
}

async function getApprovals(
  projectPath: string,
  mergeRequestIid: number,
  personalAccessToken: string,
): Promise<ReviewItemReviewer[]> {
  const payload = await requestGitLabJson<GitLabApprovalsResponse>(
    `${GITLAB_API_BASE_URL}/projects/${encodeURIComponent(projectPath)}/merge_requests/${mergeRequestIid}/approvals`,
    personalAccessToken,
    `merge request approvals request (${projectPath}!${mergeRequestIid})`,
  );

  return (payload.approved_by || [])
    .map((approval) => approval.user)
    .filter((user): user is GitLabUserRef => Boolean(user))
    .map((user) => toReviewer(user, 10));
}

export async function getGitLabPullRequests(config: RepositoryConnectionConfig): Promise<ReviewItem[]> {
  const { organization, personalAccessToken, project } = getGitLabConfig(config);

  if (!organization || !personalAccessToken) {
    throw new Error('Namespace/group y token son obligatorios para GitLab.');
  }

  const targetProjects = project
    ? [{ id: project, name: project }]
    : await getGitLabProjects(config);

  const mergeRequests = await Promise.all(
    targetProjects.map(async (targetProject) => {
      const payload = await requestGitLabPaginated<GitLabMergeRequestResponse>(
        (page, perPage) => `${GITLAB_API_BASE_URL}/projects/${encodeURIComponent(targetProject.id)}/merge_requests?state=opened&scope=all&per_page=${perPage}&page=${page}&order_by=created_at&sort=desc`,
        personalAccessToken,
        `merge requests request (${targetProject.name})`,
        50,
      );

      return Promise.all(payload.map(async (mergeRequest) => {
        const approvedReviewers = await getApprovals(targetProject.id, mergeRequest.iid, personalAccessToken);
        const reviewers = new Map<string, ReviewItemReviewer>();

        approvedReviewers.forEach((reviewer) => {
          if (reviewer.uniqueName) {
            reviewers.set(reviewer.uniqueName, reviewer);
          }
        });

        (mergeRequest.reviewers || []).forEach((reviewer) => {
          reviewers.set(reviewer.username, {
            displayName: reviewer.name,
            uniqueName: reviewer.username,
            vote: reviewers.get(reviewer.username)?.vote ?? 0,
            isRequired: true,
          });
        });

        (mergeRequest.assignees || []).forEach((assignee) => {
          if (!reviewers.has(assignee.username)) {
            reviewers.set(assignee.username, toReviewer(assignee, 0));
          }
        });

        return {
          id: mergeRequest.iid,
          title: mergeRequest.title,
          description: mergeRequest.description || 'No description provided.',
          status: mergeRequest.state,
          repository: targetProject.name,
          createdAt: mergeRequest.created_at,
          sourceBranch: mergeRequest.source_branch,
          targetBranch: mergeRequest.target_branch,
          url: mergeRequest.web_url,
          isDraft: Boolean(mergeRequest.draft || mergeRequest.work_in_progress),
          mergeStatus: mergeRequest.detailed_merge_status || 'unknown',
          createdBy: {
            displayName: mergeRequest.author?.name || mergeRequest.author?.username || 'Unknown author',
            uniqueName: mergeRequest.author?.username,
            imageUrl: mergeRequest.author?.avatar_url,
          },
          reviewers: Array.from(reviewers.values()),
        } satisfies ReviewItem;
      }));
    }),
  );

  return mergeRequests.flat().sort((left, right) =>
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}
