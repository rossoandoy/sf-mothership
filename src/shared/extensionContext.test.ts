import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isExtensionContextValid, safeSendMessage } from './extensionContext';

describe('isExtensionContextValid', () => {
  const originalChrome = globalThis.chrome;

  beforeEach(() => {
    globalThis.chrome = {
      runtime: {
        id: 'test-extension-id',
        sendMessage: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as typeof chrome;
  });

  afterEach(() => {
    globalThis.chrome = originalChrome;
  });

  it('runtime.id がある場合は true', () => {
    expect(isExtensionContextValid()).toBe(true);
  });

  it('runtime.id がない場合は false', () => {
    globalThis.chrome = { runtime: {} } as unknown as typeof chrome;
    expect(isExtensionContextValid()).toBe(false);
  });

  it('runtime 参照で例外の場合は false', () => {
    globalThis.chrome = {
      get runtime() {
        throw new Error('Extension context invalidated.');
      },
    } as unknown as typeof chrome;
    expect(isExtensionContextValid()).toBe(false);
  });
});

describe('safeSendMessage', () => {
  const originalChrome = globalThis.chrome;

  beforeEach(() => {
    globalThis.chrome = {
      runtime: {
        id: 'test-extension-id',
        sendMessage: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as typeof chrome;
  });

  afterEach(() => {
    globalThis.chrome = originalChrome;
  });

  it('有効なコンテキストでは sendMessage を呼ぶ', () => {
    const result = safeSendMessage({ type: 'TEST' });
    expect(result).toBe(true);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'TEST' });
  });

  it('無効なコンテキストでは false', () => {
    globalThis.chrome = { runtime: {} } as unknown as typeof chrome;
    expect(safeSendMessage({ type: 'TEST' })).toBe(false);
  });
});
