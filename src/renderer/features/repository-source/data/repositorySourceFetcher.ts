import type { RepositoryProject, RepositorySummary, ReviewItem } from '../../../../types/repository';
import { fetchProjects, fetchPullRequests, fetchRepositories, openReviewItem } from './repositorySourceBridge';
import type { SavedConnectionConfig } from '../types';

export interface RepositorySourceFetcherPort {
  fetchProjects(config: SavedConnectionConfig): Promise<RepositoryProject[]>;
  fetchRepositories(config: SavedConnectionConfig): Promise<RepositorySummary[]>;
  fetchPullRequests(config: SavedConnectionConfig): Promise<ReviewItem[]>;
  openReviewItem(url: string, config: SavedConnectionConfig): Promise<void>;
}

export const repositorySourceFetcher: RepositorySourceFetcherPort = {
  fetchProjects,
  fetchRepositories,
  fetchPullRequests,
  openReviewItem,
};

