import { describe, expect, it } from 'vitest';
import { deriveExtensionStatus } from './useExtensionStale';
import type { PageContext } from '@/types/context';

const context: PageContext = {
  orgDomain: 'test.lightning.force.com',
  objectApiName: 'Account',
  recordId: '001xx000003DGbQAAW',
  pageType: 'recordPage',
  url: 'https://test.lightning.force.com/lightning/r/Account/001xx000003DGbQAAW/view',
  isSandboxDomain: true,
  timestamp: 1,
};

describe('deriveExtensionStatus', () => {
  it('context がある場合は ready', () => {
    expect(deriveExtensionStatus({
      context,
      hasValidExtensionContext: true,
      pageContextError: null,
      elapsedMs: 0,
    })).toBe('ready');
  });

  it('runtime id が無効な場合は staleContentScript', () => {
    expect(deriveExtensionStatus({
      context: null,
      hasValidExtensionContext: false,
      pageContextError: null,
      elapsedMs: 0,
    })).toBe('staleContentScript');
  });

  it('sendMessage error がある場合は serviceWorkerError', () => {
    expect(deriveExtensionStatus({
      context: null,
      hasValidExtensionContext: true,
      pageContextError: 'Service Worker から応答がありません',
      elapsedMs: 0,
    })).toBe('serviceWorkerError');
  });

  it('3秒未取得の場合は waitingForContext', () => {
    expect(deriveExtensionStatus({
      context: null,
      hasValidExtensionContext: true,
      pageContextError: null,
      elapsedMs: 3_000,
    })).toBe('waitingForContext');
  });
});
