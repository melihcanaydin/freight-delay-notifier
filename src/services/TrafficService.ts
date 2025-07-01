/**
 * TrafficService provides methods to fetch and calculate traffic delays using an external API.
 * All external API calls have retry logic with exponential backoff via the retry utility.
 */
import axios from 'axios';
import { config } from '../config';
import { createServiceLogger } from '../utils/logger';
import { retry } from '../utils/retry';

const ORS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

export class TrafficService {
  private static logger = createServiceLogger('TrafficService');

  /**
   * Fetches the delay in minutes for a route from 'from' to 'to'.
   * Retries on failure up to 3 times.
   * @param from - Start location
   * @param to - End location
   * @returns Promise<number> - Estimated delay in minutes
   */
  static async getDelayInMinutes(from: string, to: string): Promise<number> {
    return retry(async (attempt) => {
      this.logger.info('Starting traffic delay calculation', {
        from,
        to,
        apiUrl: ORS_URL,
        attempt,
        timestamp: new Date().toISOString(),
      });

      const [fromCoords, toCoords] = await Promise.all([this.geocode(from), this.geocode(to)]);

      if (!fromCoords || !toCoords) {
        throw new Error('Geocoding failed');
      }

      const res = await axios.get(ORS_URL, {
        params: {
          api_key: config.orsApiKey,
          start: `${fromCoords[0]},${fromCoords[1]}`,
          end: `${toCoords[0]},${toCoords[1]}`,
        },
      });

      const route = res.data.features[0];
      if (!route) {
        throw new Error('No route found');
      }

      const duration = route.properties.summary.duration;
      const delay = Math.round((duration * 0.2) / 60);
      this.logger.info('Traffic delay calculation completed', {
        from,
        to,
        delay,
        baseDuration: duration,
        timestamp: new Date().toISOString(),
      });
      return delay;
    });
  }

  /**
   * Geocodes a place name to coordinates using the external API.
   * Retries on failure up to 3 times.
   * @param place - Place name or address
   * @returns Promise<[number, number] | null> - Coordinates or null if not found
   */
  static async geocode(place: string): Promise<[number, number] | null> {
    return retry(async (attempt) => {
      this.logger.debug('Starting geocoding request', {
        place,
        attempt,
        timestamp: new Date().toISOString(),
      });
      const res = await axios.get('https://api.openrouteservice.org/geocode/search', {
        params: {
          api_key: config.orsApiKey,
          text: place,
          size: 1,
        },
      });
      const features = res.data.features;
      if (!Array.isArray(features) || features.length === 0) {
        this.logger.warn('No geocoding results found', {
          place,
          attempt,
          timestamp: new Date().toISOString(),
        });
        return null;
      }
      const coordinates = features[0].geometry.coordinates;
      this.logger.debug('Geocoding completed successfully', {
        place,
        coordinates,
        attempt,
        timestamp: new Date().toISOString(),
      });
      return coordinates;
    });
  }
}
