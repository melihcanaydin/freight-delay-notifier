/**
 * Workflow: freightDelayWorkflow
 * Monitors a freight delivery route for traffic delays and notifies the customer if a significant delay occurs.
 * Steps:
 * 1. Fetch traffic data and calculate delay.
 * 2. If delay exceeds threshold, generate a message using AI.
 * 3. Send the message to the customer via email.
 * 4. Log all key steps and handle errors gracefully.
 *
 * @param input - WorkflowInput (validated)
 * @returns Promise<void>
 */
import { proxyActivities } from '@temporalio/workflow';
import type { WorkflowInput } from '../types/domain';
import { WorkflowInputSchema } from '../types/domain';
import { createWorkflowLogger } from '../utils/workflowLogger';

const { checkTraffic, generateMessage, sendNotification } = proxyActivities<{
  checkTraffic: (from: string, to: string) => Promise<number>;
  generateMessage: (delay: number, customerName: string) => Promise<string>;
  sendNotification: (contact: string, message: string) => Promise<void>;
}>({
  startToCloseTimeout: '1 minute',
  retry: { maximumAttempts: 3 },
});

const DEFAULT_MESSAGE =
  'Your delivery is delayed due to traffic. We are sorry for the inconvenience and are working to deliver it as soon as possible.';

export async function freightDelayWorkflow(input: WorkflowInput): Promise<void> {
  // Validate input at runtime
  const parseResult = WorkflowInputSchema.safeParse(input);
  if (!parseResult.success) {
    throw new Error(
      'Invalid workflow input: ' +
        parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
    );
  }

  const { from, to, contact, delayThreshold, customerName } = input;
  const threshold = delayThreshold ?? 30;
  const workflowId = input.workflowId || `freight-delay-${Date.now()}`;
  const logger = createWorkflowLogger(workflowId, 'freightDelayWorkflow');

  const workflowStartTime = Date.now();
  let delay: number = 0;
  let message: string = DEFAULT_MESSAGE;

  try {
    logger.info('Workflow started', {
      from,
      to,
      contact,
      delayThreshold: threshold,
      workflowId,
      timestamp: new Date().toISOString(),
    });

    // Step 1: Fetch traffic data and calculate delay
    const trafficStartTime = Date.now();
    delay = await checkTraffic(from, to);
    const trafficDuration = Date.now() - trafficStartTime;
    logger.info('Checked traffic', {
      from,
      to,
      delay,
      threshold,
      trafficDuration,
      timestamp: new Date().toISOString(),
    });

    // Step 2: If delay is below threshold, skip notification
    if (delay < threshold) {
      const totalDuration = Date.now() - workflowStartTime;
      logger.info('Delay is below threshold, no notification sent', {
        from,
        to,
        delay,
        threshold,
        contact,
        totalDuration,
        decision: 'skip_notification',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Step 3: Generate message using AI
    const messageStartTime = Date.now();
    try {
      message = await generateMessage(delay, customerName);
      const messageDuration = Date.now() - messageStartTime;
      logger.info('Message created', {
        delay,
        messageLength: message.length,
        messagePreview: message.substring(0, 100) + '...',
        messageDuration,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const messageDuration = Date.now() - messageStartTime;
      logger.warn('Message creation failed, using default message', {
        delay,
        error: err instanceof Error ? err.message : String(err),
        messageDuration,
        fallbackMessage: DEFAULT_MESSAGE,
        timestamp: new Date().toISOString(),
      });
    }

    // Step 4: Send notification to the customer
    const notificationStartTime = Date.now();
    await sendNotification(contact, message);
    const notificationDuration = Date.now() - notificationStartTime;
    const totalDuration = Date.now() - workflowStartTime;
    logger.info('Workflow finished and notification sent', {
      from,
      to,
      delay,
      contact,
      messageLength: message.length,
      trafficDuration,
      messageDuration: Date.now() - messageStartTime,
      notificationDuration,
      totalDuration,
      decision: 'notification_sent',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const totalDuration = Date.now() - workflowStartTime;
    logger.error('Workflow failed', {
      from,
      to,
      contact,
      error: err instanceof Error ? err.message : String(err),
      errorStack: err instanceof Error ? err.stack : undefined,
      totalDuration,
      delay,
      timestamp: new Date().toISOString(),
    });
    throw err;
  }
}
