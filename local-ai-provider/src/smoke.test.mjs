import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildSmokeChatRequest, runSmoke } from './smoke.mjs';

describe('Local AI Provider smoke CLI', () => {
  it('uses a fixed safe chat payload', () => {
    const request = buildSmokeChatRequest();
    const serialized = JSON.stringify(request).toLowerCase();

    assert.equal(request.task, 'diagnostic-explain');
    assert.equal(request.context.orgDomain, 'local-smoke');
    assert.equal(request.data.source, 'cli-local-provider-smoke');
    assert.equal(serialized.includes('sessionid'), false);
    assert.equal(serialized.includes('token'), false);
    assert.equal(serialized.includes('authorization'), false);
  });

  it('checks health and chat successfully', async () => {
    const calls = [];
    const result = await runSmoke({
      baseUrl: 'http://127.0.0.1:3847',
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        if (url.endsWith('/health')) {
          return Response.json({ status: 'ok', provider: 'mock' });
        }
        return Response.json({ content: '利用可能です', model: 'mock-local-ai' });
      },
    });

    assert.deepEqual(result, {
      health: { status: 'ok', provider: 'mock' },
      chat: { content: '利用可能です', model: 'mock-local-ai' },
    });
    assert.equal(calls.length, 2);
    assert.equal(calls[1].url, 'http://127.0.0.1:3847/v1/chat');
  });

  it('fails when health is not ok', async () => {
    await assert.rejects(
      () => runSmoke({
        fetchImpl: async () => Response.json({ status: 'error' }, { status: 503 }),
      }),
      /health failed: HTTP 503/
    );
  });

  it('explains when the provider is not reachable', async () => {
    await assert.rejects(
      () => runSmoke({
        baseUrl: 'http://127.0.0.1:9',
        fetchImpl: async () => {
          throw new Error('fetch failed');
        },
      }),
      /Local AI Provider is not reachable at http:\/\/127\.0\.0\.1:9/
    );
  });

  it('fails when chat is not ok', async () => {
    await assert.rejects(
      () => runSmoke({
        fetchImpl: async (url) => {
          if (url.endsWith('/health')) {
            return Response.json({ status: 'ok' });
          }
          return Response.json({ error: 'chat failed' }, { status: 502 });
        },
      }),
      /chat failed: HTTP 502/
    );
  });
});
