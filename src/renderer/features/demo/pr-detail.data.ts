export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  avatar?: string;
}

export interface TaskDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  assignee: string;
  priority: string;
}

export interface LogMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
}

export const initialComments: Comment[] = [
  {
    id: '1',
    author: 'John Doe',
    content: 'Please review the authentication flow',
    timestamp: new Date('2024-01-20T10:00:00'),
  },
  {
    id: '2',
    author: 'Jane Smith',
    content: 'The error handling looks good, but we might want to add more logging',
    timestamp: new Date('2024-01-20T11:30:00'),
  },
];

export const initialTaskDetail: TaskDetail = {
  id: 'HU-123',
  title: 'Implement User Authentication',
  description: 'Add secure authentication flow using JWT tokens and implement password reset functionality',
  status: 'In Progress',
  assignee: 'John Doe',
  priority: 'High',
};
