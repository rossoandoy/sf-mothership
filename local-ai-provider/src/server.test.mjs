import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createLocalAiProviderServer } from './server.mjs';
import { MAX_BODY_BYTES, sanitizePayload } from './safety.mjs';

const server = createLocalAiProviderServer({ providerName: 'mock' });
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
});

describe('Local AI Provider server', () => {
  it('returns health status', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.provider, 'mock');
  });

  it('returns deterministic mock chat response', async () => {
    const response = await fetch(`${baseUrl}/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'summarize',
        prompt: 'Summarize the current Salesforce record.',
        context: { objectApiName: 'Account' },
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.model, 'mock-local-ai');
    assert.match(body.content, /\[mock:summarize\]/);
    assert.match(body.content, /Summarize the current Salesforce record\./);
  });

  it('rejects body larger than the limit', async () => {
    const response = await fetch(`${baseUrl}/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'large',
        prompt: 'x'.repeat(MAX_BODY_BYTES),
      }),
    });

    assert.equal(response.status, 413);
  });

  it('returns 404 for unknown paths', async () => {
    const response = await fetch(`${baseUrl}/unknown`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.match(body.message, /Allowed paths/);
  });

  it('handles preflight without wildcard CORS origin', async () => {
    const response = await fetch(`${baseUrl}/v1/chat`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'chrome-extension://example',
        'Access-Control-Request-Method': 'POST',
      },
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), 'chrome-extension://example');
    assert.notEqual(response.headers.get('access-control-allow-origin'), '*');
  });
});

describe('Local AI Provider safety', () => {
  it('masks secret-like keys recursively', () => {
    const sanitized = sanitizePayload({
      sessionId: 'abc',
      nested: {
        token: 'def',
        safe: 'ok',
      },
      rows: [
        {
          authorization: 'Bearer xyz',
          value: 1,
        },
      ],
    });

    assert.deepEqual(sanitized, {
      sessionId: '[removed]',
      nested: {
        token: '[removed]',
        safe: 'ok',
      },
      rows: [
        {
          authorization: '[removed]',
          value: 1,
        },
      ],
    });
  });
});
