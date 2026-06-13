import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildLocalProviderSmokeRequest, runLocalProviderSmokeTest } from './localProviderSmoke';
import { sendAppServerChat } from './appServerClient';

vi.mock('./appServerClient', () => ({
  sendAppServerChat: vi.fn(),
}));

const mockedSendAppServerChat = vi.mocked(sendAppServerChat);

describe('localProviderSmoke', () => {
  beforeEach(() => {
    mockedSendAppServerChat.mockReset();
  });

  it('session や token を含まない固定 smoke request を作る', () => {
    const request = buildLocalProviderSmokeRequest();
    const serialized = JSON.stringify(request).toLowerCase();

    expect(request).toEqual({
      task: 'diagnostic-explain',
      prompt: 'SF Mothership の Local AI Provider smoke test として、日本語で短く「利用可能です」と返してください。',
      context: {
        orgDomain: 'local-smoke',
        objectApiName: null,
        recordId: null,
        pageType: 'other',
        isSandbox: true,
      },
      data: {
        source: 'options-local-provider-smoke',
      },
    });
    expect(serialized).not.toContain('sessionid');
    expect(serialized).not.toContain('token');
    expect(serialized).not.toContain('authorization');
  });

  it('Local AI Provider の応答を smoke result として返す', async () => {
    mockedSendAppServerChat.mockResolvedValue({
      ok: true,
      data: {
        content: '利用可能です',
        model: 'mock-local-ai',
      },
    });

    await expect(runLocalProviderSmokeTest()).resolves.toEqual({
      ok: true,
      data: {
        content: '利用可能です',
        model: 'mock-local-ai',
      },
    });
    expect(mockedSendAppServerChat).toHaveBeenCalledWith(buildLocalProviderSmokeRequest());
  });

  it('Local AI Provider の失敗を error として返す', async () => {
    mockedSendAppServerChat.mockResolvedValue({
      ok: false,
      error: 'Local AI Provider が起動していません',
    });

    await expect(runLocalProviderSmokeTest()).resolves.toEqual({
      ok: false,
      error: 'Local AI Provider が起動していません',
    });
  });
});
