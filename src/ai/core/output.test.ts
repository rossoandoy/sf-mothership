import { describe, expect, it } from 'vitest';
import { processAiOutput } from './output';
import type { AiRequest, AiResponse } from './types';

const baseRequest: AiRequest = {
  task: 'test',
  prompt: 'test',
  context: {},
  locale: 'ja-JP',
  privacy: 'onDeviceOnly',
};

const baseResponse: AiResponse = {
  content: '{"ok":true}',
  provider: 'chrome-prompt',
};

describe('processAiOutput', () => {
  it('json mode は JSON を parsed に入れる', () => {
    const result = processAiOutput({
      ...baseRequest,
      outputMode: 'json',
    }, baseResponse);

    expect(result).toEqual({
      ok: true,
      data: {
        content: '{"ok":true}',
        provider: 'chrome-prompt',
        parsed: { ok: true },
      },
    });
  });

  it('onDeviceOnly + json + invalid JSON は失敗する', () => {
    const result = processAiOutput({
      ...baseRequest,
      outputMode: 'json',
    }, {
      ...baseResponse,
      content: 'not json',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('JSON');
    }
  });

  it('draft mode は不正 JSON でも text draft として返す', () => {
    const result = processAiOutput({
      ...baseRequest,
      outputMode: 'draft',
      responseSchema: { type: 'object' },
    }, {
      ...baseResponse,
      content: 'not json',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.content).toBe('not json');
      expect(result.data.parsed).toBeUndefined();
    }
  });

  it('responseSchema がある json mode では schema 違反を失敗にする', () => {
    const result = processAiOutput({
      ...baseRequest,
      outputMode: 'json',
      responseSchema: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
        },
      },
    }, {
      ...baseResponse,
      content: '{"name":123}',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('schema');
    }
  });
});
