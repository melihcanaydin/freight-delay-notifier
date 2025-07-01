import { Client } from '@temporalio/client';
import { freightDelayWorkflow } from './freightDelayWorkflow';
import { createServiceLogger } from '../utils/logger';

const logger = createServiceLogger('TriggerWorkflow');

export async function triggerFreightDelayWorkflow() {
  const startTime = Date.now();

  try {
    logger.info('Starting freight delay workflow trigger', {
      timestamp: new Date().toISOString(),
    });

    const client = new Client();

    const handle = await client.workflow.start(freightDelayWorkflow, {
      taskQueue: 'FREIGHT_DELAY_TASK_QUEUE',
      workflowId: `freight-delay-${Date.now()}`,
      args: [
        {
          from: 'New York, NY',
          to: 'Los Angeles, CA',
          contact: 'melihcanaydin@gmail.com',
          delayThreshold: 30,
          customerName: 'Michael Jackson',
        },
      ],
    });

    logger.info('Freight delay workflow started successfully', {
      workflowId: handle.workflowId,
      timestamp: new Date().toISOString(),
    });

    const totalDuration = Date.now() - startTime;
    logger.info('Freight delay workflow trigger completed', {
      workflowId: handle.workflowId,
      totalDuration,
      timestamp: new Date().toISOString(),
    });

    return handle;
  } catch (err: unknown) {
    const totalDuration = Date.now() - startTime;
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Freight delay workflow trigger failed', {
      error: error.message,
      errorStack: error.stack,
      totalDuration,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

if (require.main === module) {
  triggerFreightDelayWorkflow()
    .then(() => {
      logger.info('Workflow trigger completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Workflow trigger failed', { error: error.message });
      process.exit(1);
    });
}
