import { describe, expect, it } from 'vitest';
import { describeLocalProviderHealthResult } from './localProviderDiagnostics';
import type { Result } from '@/shared/result';
import type { AppServerHealthResponse } from '@/types/appServer';

describe('describeLocalProviderHealthResult', () => {
  it('ok の場合は接続OKを返す', () => {
    const result: Result<AppServerHealthResponse> = { ok: true, data: { status: 'ok' } };

    expect(describeLocalProviderHealthResult(result)).toEqual({
      ok: true,
      message: '接続OK (ok)',
    });
  });

  it('localhost 以外の URL は wrongUrl として説明する', () => {
    const result: Result<AppServerHealthResponse> = {
      ok: false,
      error: 'Local AI Provider URL は localhost / 127.0.0.1 のみ許可されています',
    };

    const description = describeLocalProviderHealthResult(result);
    expect(description.ok).toBe(false);
    if (!description.ok) {
      expect(description.kind).toBe('wrongUrl');
      expect(description.message).toContain('localhost');
    }
  });

  it('fetch failure は serverStopped として説明する', () => {
    const result: Result<AppServerHealthResponse> = {
      ok: false,
      error: 'Local AI Provider に接続できません。サーバーが起動しているか確認してください。 (Failed to fetch)',
    };

    const description = describeLocalProviderHealthResult(result);
    expect(description.ok).toBe(false);
    if (!description.ok) {
      expect(description.kind).toBe('serverStopped');
      expect(description.message).toContain('起動');
    }
  });

  it('CORS は cors として説明する', () => {
    const result: Result<AppServerHealthResponse> = {
      ok: false,
      error: 'CORS policy blocked the request',
    };

    const description = describeLocalProviderHealthResult(result);
    expect(description.ok).toBe(false);
    if (!description.ok) {
      expect(description.kind).toBe('cors');
      expect(description.message).toContain('CORS');
    }
  });
});
