import { describe, expect, it } from 'vitest';
import { getProviderOrder } from './aiProvider';
import type { AiRequest } from './aiProvider';
import type { AiProviderSettings } from '@/types/appServer';

const baseRequest: AiRequest = {
  task: 'diagnostic-explain',
  prompt: '説明してください',
  context: {
    orgDomain: 'test.lightning.force.com',
    objectApiName: 'Account',
    recordId: '001xx000003DGbQAAW',
    pageType: 'recordPage',
    isSandbox: true,
  },
  locale: 'ja-JP',
  privacy: 'localServerAllowed',
};

describe('getProviderOrder', () => {
  const localOnly: AiProviderSettings = {
    mode: 'local-only',
    allowChromePromptInTools: false,
  };

  const hybridEnabled: AiProviderSettings = {
    mode: 'hybrid',
    allowChromePromptInTools: true,
  };

  it('Local AI Provider only では local-http だけを候補にする', () => {
    const order = getProviderOrder(baseRequest, localOnly);

    expect(order).toEqual(['local-http']);
  });

  it('オンデバイス限定でも Chrome Prompt が通常ツールで許可されていなければ候補なしにする', () => {
    const order = getProviderOrder({
      ...baseRequest,
      privacy: 'onDeviceOnly',
    }, localOnly);

    expect(order).toEqual([]);
  });

  it('オンデバイス限定かつ Chrome Prompt 許可なら Chrome Prompt だけを候補にする', () => {
    const order = getProviderOrder({
      ...baseRequest,
      privacy: 'onDeviceOnly',
    }, hybridEnabled);

    expect(order).toEqual(['chrome-prompt']);
  });

  it('hybrid ではアクセス診断説明は Chrome Prompt を先に試す', () => {
    const order = getProviderOrder({
      ...baseRequest,
      task: 'diagnostic-explain',
    }, hybridEnabled);

    expect(order).toEqual(['chrome-prompt', 'local-http']);
  });

  it('hybrid では構造化生成と重い分析は Local AI Provider を先に試す', () => {
    expect(getProviderOrder({ ...baseRequest, task: 'tool-definition' }, hybridEnabled)).toEqual([
      'local-http',
      'chrome-prompt',
    ]);
    expect(getProviderOrder({ ...baseRequest, task: 'report-analyze' }, hybridEnabled)).toEqual([
      'local-http',
      'chrome-prompt',
    ]);
  });

  it('Chrome Prompt only でも通常ツールで未許可なら候補なしにする', () => {
    expect(getProviderOrder(baseRequest, {
      mode: 'chrome-prompt-only',
      allowChromePromptInTools: false,
    })).toEqual([]);
  });
});
