import { TrafficService } from '../services/TrafficService';
import { createActivityLogger } from '../utils/logger';

export async function checkTraffic(from: string, to: string): Promise<number> {
  const logger = createActivityLogger('checkTraffic');

  try {
    logger.info('Starting traffic check activity', {
      from,
      to,
      timestamp: new Date().toISOString(),
    });

    const delay = await TrafficService.getDelayInMinutes(from, to);

    logger.info('Traffic check activity completed', {
      from,
      to,
      delay,
      timestamp: new Date().toISOString(),
    });

    return delay;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Traffic check activity failed', {
      from,
      to,
      error: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}
