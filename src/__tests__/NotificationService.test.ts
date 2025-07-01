import { NotificationService } from '../services/NotificationService';
import sgMail from '@sendgrid/mail';
import * as retryUtils from '../utils/retry';

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}));
jest.mock('../config', () => ({ config: { sendgridApiKey: 'test-key' } }));

describe('NotificationService', () => {
  const contact = 'test@example.com';
  const message = 'Test message';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sends email notification successfully', async () => {
    const setApiKey = sgMail.setApiKey as jest.Mock;
    const send = sgMail.send as jest.Mock;
    send.mockResolvedValueOnce(undefined);
    jest
      .spyOn(retryUtils, 'retry')
      .mockImplementation((fn) => (fn as (attempt: number) => Promise<unknown>)(1));
    await NotificationService.send(contact, message);
    expect(setApiKey).toHaveBeenCalledWith('test-key');
    expect(send).toHaveBeenCalledWith({
      to: contact,
      from: 'melihcanaydin@gmail.com',
      subject: 'Freight Delivery Delay Notice',
      text: message,
    });
  });

  it('retries and throws if send fails', async () => {
    const send = sgMail.send as jest.Mock;
    send.mockRejectedValueOnce(new Error('Send error'));
    jest.spyOn(retryUtils, 'retry').mockImplementation(() => Promise.reject('fail'));
    await expect(NotificationService.send(contact, message)).rejects.toBe('fail');
  });

  it('throws if SendGrid API key is missing', async () => {
    jest.resetModules();
    jest.doMock('../config', () => ({ config: { sendgridApiKey: undefined } }));
    const mod = await import('../services/NotificationService');
    const NotificationServiceNoKey = mod.NotificationService;
    await expect(NotificationServiceNoKey.send(contact, message)).rejects.toThrow(
      'SendGrid API key is missing',
    );
  });
});
