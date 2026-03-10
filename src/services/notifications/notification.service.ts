import { Notification } from 'electron';
import type { PullRequest } from '../../types/azure';

export class NotificationService {
  static showPRNotification(pr: PullRequest) {
    try {
      if (Notification.isSupported()) {
        const notification = new Notification({
          title: '🔍 Pull Request Pending Review',
          body: `Repository: ${pr.repository}\nPR: ${pr.title}\n\nClick to review, approve, or reject`,
          silent: false
        });

        notification.show();

        notification.on('click', () => {
          console.log('Opening PR review window');
        });
      } else {
        console.warn('Notifications are not supported on this system');
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
}
