import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities/checkTraffic';
import * as genMsg from './activities/generateMessage';
import * as sendNotif from './activities/sendNotification';
import { createServiceLogger } from './utils/logger';

async function run() {
  const logger = createServiceLogger('TemporalWorker');
  const startTime = Date.now();

  try {
    logger.info('Initializing Temporal worker', {
      taskQueue: 'FREIGHT_DELAY_TASK_QUEUE',
      activities: ['checkTraffic', 'generateMessage', 'sendNotification'],
      workflows: ['freightDelayWorkflow'],
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });

    const temporalAddress = process.env.TEMPORAL_ADDRESS || 'temporal-server:7233';
    logger.info('Connecting to Temporal server', {
      address: temporalAddress,
      timestamp: new Date().toISOString(),
    });

    const connection = await NativeConnection.connect({
      address: temporalAddress,
    });

    logger.info('Connected to Temporal server successfully', {
      address: temporalAddress,
      timestamp: new Date().toISOString(),
    });

    const worker = await Worker.create({
      connection,
      workflowsPath: require.resolve('./workflows/freightDelayWorkflow'),
      activities: {
        ...activities,
        ...genMsg,
        ...sendNotif,
      },
      taskQueue: 'FREIGHT_DELAY_TASK_QUEUE',
    });

    const initDuration = Date.now() - startTime;
    logger.info('Temporal worker initialized successfully', {
      taskQueue: 'FREIGHT_DELAY_TASK_QUEUE',
      initDuration,
      timestamp: new Date().toISOString(),
    });

    logger.info('Starting Temporal worker...', {
      taskQueue: 'FREIGHT_DELAY_TASK_QUEUE',
      timestamp: new Date().toISOString(),
    });

    await worker.run();
  } catch (err: unknown) {
    const totalDuration = Date.now() - startTime;
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Temporal worker failed to start', {
      error,
      errorMessage: error.message,
      errorStack: error.stack,
      errorCode:
        typeof (error as { code?: unknown }).code === 'string'
          ? (error as { code?: string }).code
          : undefined,
      totalDuration,
      timestamp: new Date().toISOString(),
    });

    console.error('Temporal worker failed to start:', error);
    try {
      console.error(
        'Full error details:',
        JSON.stringify(error, Object.getOwnPropertyNames(error)),
      );
    } catch (jsonErr) {
      console.error('Error stringifying error:', jsonErr);
    }
    process.exit(1);
  }
}

run();
