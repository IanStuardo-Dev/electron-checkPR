export interface PullRequest {
  id: number;
  title: string;
  description: string;
  status: string;
  repository: string;
  createdBy: {
    displayName: string;
    imageUrl: string;
  };
}

export class PullRequestService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getPullRequests(): Promise<PullRequest[]> {
    return [{
      id: 1,
      title: "feat: Add user authentication module",
      description: "Adding OAuth2 implementation for user login",
      status: "active",
      repository: "backend-api",
      createdBy: {
        displayName: "John Doe",
        imageUrl: "https://via.placeholder.com/50"
      }
    }];
  }
}