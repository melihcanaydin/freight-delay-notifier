/**
 * NotificationService sends messages to customers via email (SendGrid).
 * Includes retry logic for the SendGrid API call.
 */
import sgMail from '@sendgrid/mail';
import { config } from '../config';
import { createServiceLogger } from '../utils/logger';
import { retry } from '../utils/retry';

/**
 * NotificationService sends messages to customers via email (SendGrid).
 * Includes retry logic for the SendGrid API call.
 */
export class NotificationService {
  private static logger = createServiceLogger('NotificationService');

  /**
   * Sends a notification email to the customer using SendGrid.
   * Retries the API call up to 3 times on failure.
   * @param contact - Email address of the customer
   * @param message - Message to send
   * @returns Promise<void>
   */
  static async send(contact: string, message: string): Promise<void> {
    if (!config.sendgridApiKey) {
      throw new Error('SendGrid API key is missing');
    }
    await retry(
      async (attempt) => {
        this.logger.info('Sending email notification', {
          contact,
          messageLength: message.length,
          attempt,
        });
        sgMail.setApiKey(config.sendgridApiKey);
        const emailData = {
          to: contact,
          from: 'melihcanaydin@gmail.com',
          subject: 'Freight Delivery Delay Notice',
          text: message,
        };
        await sgMail.send(emailData);
        this.logger.info('Email notification sent', { contact });
      },
      3,
      500,
    );
  }
}
