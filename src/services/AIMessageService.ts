/**
 * AIMessageService generates a friendly message for the customer using OpenAI.
 * Includes retry logic for the OpenAI API call.
 */
import OpenAI from 'openai';
import { config } from '../config';
import { createServiceLogger } from '../utils/logger';
import { retry } from '../utils/retry';

/**
 * AIMessageService generates a friendly message for the customer using OpenAI.
 * Includes retry logic for the OpenAI API call.
 */
export class AIMessageService {
  private static logger = createServiceLogger('AIMessageService');
  private static openai: OpenAI | null = null;

  // Allow injection of OpenAI client for testing
  static setOpenAIClient(client: OpenAI) {
    this.openai = client;
  }

  private static getOpenAIClient(): OpenAI {
    if (this.openai) return this.openai;
    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    return this.openai;
  }

  /**
   * Generates a friendly message for the customer about the delay.
   * Retries the OpenAI API call up to 3 times on failure.
   * @param delay - Delay in minutes
   * @param customerName - Customer's name
   * @returns Promise<string> - Generated message
   */
  static async generateMessage(delay: number, customerName: string): Promise<string> {
    return retry(
      async (attempt) => {
        this.logger.info('Generating message', {
          delay,
          customerName,
          attempt,
        });
        const prompt = `Write a short, polite message to tell ${customerName} that their delivery is delayed by ${delay} minutes because of traffic. Keep it simple and friendly. Name of the Emailer is Melih Can AYDIN and the company name is MCA Corp.`;
        const openai = this.getOpenAIClient();
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.7,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });
        const message = response.choices[0]?.message?.content || '';
        if (!message) {
          const fallback = `Dear ${customerName}, your delivery is delayed by ${delay} minutes due to traffic. We are working to deliver it as soon as possible. Thank you for your patience.`;
          this.logger.warn('Using fallback message due to empty AI response', {
            delay,
            customerName,
          });
          return fallback;
        }
        this.logger.info('Message generated', { messageLength: message.length });
        return message;
      },
      3,
      500,
    ).catch(() => {
      const fallback = `Dear ${customerName}, your delivery is delayed by ${delay} minutes due to traffic. We are working to deliver it as soon as possible. Thank you for your patience.`;
      this.logger.warn('Using fallback message after all retries failed', { delay, customerName });
      return fallback;
    });
  }
}
