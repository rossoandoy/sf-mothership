import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { mockProvider } from './providers/mock.mjs';
import { createOllamaProvider } from './providers/ollama.mjs';
import { HttpError, readJsonBody } from './safety.mjs';

export const DEFAULT_PORT = 3847;

function isAllowedOrigin(origin) {
  return (
    typeof origin === 'string' &&
    (
      origin.startsWith('chrome-extension://') ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1')
    )
  );
}

function applyCors(request, response) {
  const origin = request.headers.origin;
  if (isAllowedOrigin(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept');
}

function sendJson(request, response, statusCode, body) {
  applyCors(request, response);
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function selectProvider(providerName, options = {}) {
  if (providerName === 'ollama') {
    return createOllamaProvider(options.ollama);
  }
  return mockProvider;
}

export function createLocalAiProviderServer(options = {}) {
  const providerName = options.providerName ?? process.env.LOCAL_AI_PROVIDER ?? 'mock';
  const provider = options.provider ?? selectProvider(providerName, options);
  const version = options.version ?? '0.1.0';

  return createServer(async (request, response) => {
    applyCors(request, response);

    if (request.method === 'OPTIONS') {
      response.writeHead(204);
      response.end();
      return;
    }

    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);

    try {
      if (request.method === 'GET' && url.pathname === '/health') {
        sendJson(request, response, 200, {
          status: 'ok',
          provider: provider.id,
          version,
        });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/v1/chat') {
        const payload = await readJsonBody(request);
        const result = await provider.complete(payload);
        sendJson(request, response, 200, result);
        return;
      }

      sendJson(request, response, 404, {
        error: 'Not Found',
        message: 'Allowed paths are GET /health and POST /v1/chat.',
      });
    } catch (e) {
      const statusCode = e instanceof HttpError ? e.statusCode : 502;
      const message = e instanceof Error ? e.message : 'Unknown Local AI Provider error';
      sendJson(request, response, statusCode, {
        error: message,
      });
    }
  });
}

function startServer() {
  const port = Number(process.env.LOCAL_AI_PORT ?? DEFAULT_PORT);
  const providerName = process.env.LOCAL_AI_PROVIDER ?? 'mock';
  const server = createLocalAiProviderServer({ providerName });

  server.listen(port, '127.0.0.1', () => {
    console.log(`Local AI Provider (${providerName}) listening on http://127.0.0.1:${port}`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
