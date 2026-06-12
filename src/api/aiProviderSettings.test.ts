import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_AI_PROVIDER_SETTINGS,
  getAiProviderSettings,
  setAiProviderSettings,
} from './aiProviderSettings';

const store = new Map<string, unknown>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: store.get(key) })),
        set: vi.fn(async (values: Record<string, unknown>) => {
          for (const [key, value] of Object.entries(values)) {
            store.set(key, value);
          }
        }),
      },
    },
  });
});

describe('aiProviderSettings', () => {
  it('storage が空なら安全側の default を返す', async () => {
    await expect(getAiProviderSettings()).resolves.toEqual(DEFAULT_AI_PROVIDER_SETTINGS);
  });

  it('保存した設定を返す', async () => {
    await setAiProviderSettings({
      mode: 'hybrid',
      allowChromePromptInTools: true,
    });

    await expect(getAiProviderSettings()).resolves.toEqual({
      mode: 'hybrid',
      allowChromePromptInTools: true,
    });
  });

  it('unknown 値は default に戻す', async () => {
    store.set('ai_provider_settings', {
      mode: 'unknown',
      allowChromePromptInTools: 'yes',
    });

    await expect(getAiProviderSettings()).resolves.toEqual(DEFAULT_AI_PROVIDER_SETTINGS);
  });

  it('legacy app-server-only は local-only に正規化する', async () => {
    store.set('ai_provider_settings', {
      mode: 'app-server-only',
      allowChromePromptInTools: false,
    });

    await expect(getAiProviderSettings()).resolves.toEqual({
      mode: 'local-only',
      allowChromePromptInTools: false,
    });
  });
});
