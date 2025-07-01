import * as retryUtils from '../utils/retry';

describe('AIMessageService', () => {
  const customerName = 'John Doe';
  const delay = 15;
  let AIMessageService: typeof import('../services/AIMessageService').AIMessageService;
  let mockCreate: jest.Mock;
  let mockOpenAI: unknown;

  beforeEach(async () => {
    jest.resetModules();
    mockCreate = jest.fn();
    mockOpenAI = {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    };
    const mod = await import('../services/AIMessageService');
    AIMessageService = mod.AIMessageService;
    AIMessageService.setOpenAIClient(mockOpenAI as unknown as import('openai').default);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns generated message from OpenAI', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Test message' } }],
    });
    jest
      .spyOn(retryUtils, 'retry')
      .mockImplementation((fn) => (fn as (attempt: number) => Promise<unknown>)(1));
    const message = await AIMessageService.generateMessage(delay, customerName);
    expect(message).toBe('Test message');
    expect(mockCreate).toHaveBeenCalled();
  });

  it('returns fallback message if OpenAI fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'));
    jest.spyOn(retryUtils, 'retry').mockImplementation(() => Promise.reject('fail'));
    const message = await AIMessageService.generateMessage(delay, customerName);
    expect(message).toContain('your delivery is delayed by');
  });

  it('returns fallback message if OpenAI returns empty choices', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [] });
    jest
      .spyOn(retryUtils, 'retry')
      .mockImplementation((fn) => (fn as (attempt: number) => Promise<unknown>)(1));
    const message = await AIMessageService.generateMessage(delay, customerName);
    expect(message).toContain('your delivery is delayed by');
  });

  it('returns fallback message if OpenAI returns choice with no content', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: '' } }] });
    jest
      .spyOn(retryUtils, 'retry')
      .mockImplementation((fn) => (fn as (attempt: number) => Promise<unknown>)(1));
    const message = await AIMessageService.generateMessage(delay, customerName);
    expect(message).toContain('your delivery is delayed by');
  });
});
