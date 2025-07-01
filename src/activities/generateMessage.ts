/**
 * Activity: generateMessage
 * Calls AIMessageService to generate a friendly message for the customer.
 * Logs each step and handles errors gracefully.
 * @param delay - Delay in minutes
 * @param customerName - Customer's name
 * @returns Promise<string> - Generated message
 */
import { AIMessageService } from '../services/AIMessageService';
import { createActivityLogger } from '../utils/logger';

export async function generateMessage(delay: number, customerName: string): Promise<string> {
  const logger = createActivityLogger('generateMessage');

  try {
    logger.info('Generating message', { delay, customerName });
    const message = await AIMessageService.generateMessage(delay, customerName);
    logger.info('Message created', {
      delay,
      customerName,
      messageLength: message.length,
    });
    return message;
  } catch (err: unknown) {
    logger.error('Message generation failed', {
      delay,
      customerName,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
