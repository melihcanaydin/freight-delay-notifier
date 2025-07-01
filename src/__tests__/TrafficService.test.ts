import { TrafficService } from '../services/TrafficService';
import axios from 'axios';
import * as retryUtils from '../utils/retry';

jest.mock('axios');
jest.mock('../config', () => ({ config: { orsApiKey: 'test-key' } }));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TrafficService', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('getDelayInMinutes', () => {
    it('returns delay in minutes for valid route', async () => {
      jest
        .spyOn(TrafficService, 'geocode')
        .mockResolvedValueOnce([1, 2])
        .mockResolvedValueOnce([3, 4]);
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          features: [{ properties: { summary: { duration: 600 } } }],
        },
      });
      jest
        .spyOn(retryUtils, 'retry')
        .mockImplementation((fn) => (fn as (attempt: number) => Promise<unknown>)(1));
      const delay = await TrafficService.getDelayInMinutes('A', 'B');
      expect(delay).toBe(Math.round((600 * 0.2) / 60));
    });

    it('throws error if geocoding fails', async () => {
      jest.spyOn(TrafficService, 'geocode').mockResolvedValueOnce(null);
      jest
        .spyOn(retryUtils, 'retry')
        .mockImplementation(() => Promise.reject(new Error('Geocoding failed')));
      await expect(TrafficService.getDelayInMinutes('A', 'B')).rejects.toThrow('Geocoding failed');
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('throws error if no route found', async () => {
      jest
        .spyOn(TrafficService, 'geocode')
        .mockResolvedValueOnce([1, 2])
        .mockResolvedValueOnce([3, 4]);
      mockedAxios.get.mockResolvedValueOnce({ data: { features: [] } });
      jest
        .spyOn(retryUtils, 'retry')
        .mockImplementation((fn) => (fn as (attempt: number) => Promise<unknown>)(1));
      await expect(TrafficService.getDelayInMinutes('A', 'B')).rejects.toThrow('No route found');
    });
  });

  describe('geocode', () => {
    it('returns coordinates for valid place', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { features: [{ geometry: { coordinates: [1, 2] } }] },
      });
      jest
        .spyOn(retryUtils, 'retry')
        .mockImplementation((fn) => (fn as (attempt: number) => Promise<unknown>)(1));
      const coords = await TrafficService.geocode('Place');
      expect(coords).toEqual([1, 2]);
    });

    it('returns null if no feature found', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { features: [] } });
      jest
        .spyOn(retryUtils, 'retry')
        .mockImplementation((fn) => (fn as (attempt: number) => Promise<unknown>)(1));
      const coords = await TrafficService.geocode('Place');
      expect(coords).toBeNull();
    });

    it('returns null if geocode API returns malformed data', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: {} });
      jest
        .spyOn(retryUtils, 'retry')
        .mockImplementation((fn) => (fn as (attempt: number) => Promise<unknown>)(1));
      const coords = await TrafficService.geocode('Place');
      expect(coords).toBeNull();
    });
  });
});
