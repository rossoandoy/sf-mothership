import { beforeEach, describe, expect, it, vi } from 'vitest';
import { callApi } from './useApi';

const sendMessage = vi.fn();

beforeEach(() => {
  sendMessage.mockReset();
  vi.stubGlobal('chrome', {
    runtime: {
      sendMessage,
    },
  });
});

describe('callApi', () => {
  it('Salesforce API proxy message を送る', async () => {
    sendMessage.mockResolvedValue({
      ok: true,
      data: { totalSize: 1, records: [] },
    });

    const result = await callApi('query', {
      domain: 'example.lightning.force.com',
      soql: 'SELECT Id FROM Account',
    });

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'SALESFORCE_API_REQUEST',
      payload: {
        domain: 'example.lightning.force.com',
        action: 'query',
        params: {
          soql: 'SELECT Id FROM Account',
        },
      },
    });
    expect(result).toEqual({
      ok: true,
      data: { totalSize: 1, records: [] },
    });
  });

  it('Service Worker の error response をそのまま返す', async () => {
    sendMessage.mockResolvedValue({
      ok: false,
      error: 'soql は必須です',
    });

    await expect(callApi('query', {
      domain: 'example.lightning.force.com',
      soql: '',
    })).resolves.toEqual({
      ok: false,
      error: 'soql は必須です',
    });
  });

  it('runtime exception を proxy 通信失敗として返す', async () => {
    sendMessage.mockRejectedValue(new Error('Extension context invalidated'));

    await expect(callApi('orgInfo', {
      domain: 'example.lightning.force.com',
    })).resolves.toEqual({
      ok: false,
      error: 'Salesforce API proxy 通信失敗: Extension context invalidated',
    });
  });

  it('domain が空なら message を送らず error にする', async () => {
    await expect(callApi('query', {
      soql: 'SELECT Id FROM Account',
    })).resolves.toEqual({
      ok: false,
      error: 'domain は必須です',
    });
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
