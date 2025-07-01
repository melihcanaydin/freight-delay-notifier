import { NotificationService } from '../services/NotificationService';
import { createActivityLogger } from '../utils/logger';

export async function sendNotification(contact: string, message: string): Promise<void> {
  const logger = createActivityLogger('sendNotification');

  try {
    logger.info('Starting notification sending activity', {
      contact,
      messageLength: message.length,
      contactType: contact.includes('@') ? 'email' : 'unknown',
      timestamp: new Date().toISOString(),
    });

    await NotificationService.send(contact, message);

    logger.info('Notification sending activity completed', {
      contact,
      messageLength: message.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Notification sending activity failed', {
      contact,
      error: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}
