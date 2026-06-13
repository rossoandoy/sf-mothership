import { fileURLToPath } from 'node:url';

export const DEFAULT_LOCAL_AI_BASE_URL = 'http://127.0.0.1:3847';

function trimTrailingSlash(value) {
  return value.replace(/\/$/, '');
}

function formatResponseDetail(body) {
  if (!body) return '';
  if (typeof body === 'string') return body;
  return JSON.stringify(body);
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function buildSmokeChatRequest() {
  return {
    task: 'diagnostic-explain',
    prompt: 'SF Mothership の Local AI Provider CLI smoke test として、日本語で短く「利用可能です」と返してください。',
    context: {
      orgDomain: 'local-smoke',
      objectApiName: null,
      recordId: null,
      pageType: 'other',
      isSandbox: true,
    },
    data: {
      source: 'cli-local-provider-smoke',
    },
  };
}

export async function runSmoke({
  baseUrl = process.env.LOCAL_AI_BASE_URL ?? DEFAULT_LOCAL_AI_BASE_URL,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is not available in this Node.js runtime.');
  }

  const normalizedBaseUrl = trimTrailingSlash(baseUrl);
  let healthResponse;
  try {
    healthResponse = await fetchImpl(`${normalizedBaseUrl}/health`, {
      headers: { Accept: 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown network error';
    throw new Error(`Local AI Provider is not reachable at ${normalizedBaseUrl}. ${message}`);
  }
  const healthBody = await readJsonResponse(healthResponse);
  if (!healthResponse.ok || healthBody?.status !== 'ok') {
    throw new Error(`health failed: HTTP ${healthResponse.status} ${formatResponseDetail(healthBody)}`);
  }

  let chatResponse;
  try {
    chatResponse = await fetchImpl(`${normalizedBaseUrl}/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(buildSmokeChatRequest()),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown network error';
    throw new Error(`Local AI Provider is not reachable at ${normalizedBaseUrl}. ${message}`);
  }
  const chatBody = await readJsonResponse(chatResponse);
  if (!chatResponse.ok || typeof chatBody?.content !== 'string') {
    throw new Error(`chat failed: HTTP ${chatResponse.status} ${formatResponseDetail(chatBody)}`);
  }

  return {
    health: healthBody,
    chat: chatBody,
  };
}

async function main() {
  try {
    const result = await runSmoke();
    console.log(`health OK: provider=${result.health.provider ?? 'unknown'}`);
    console.log(`chat OK: ${result.chat.content}`);
    if (result.chat.model) {
      console.log(`model: ${result.chat.model}`);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown smoke test error';
    console.error(`Local AI Provider smoke failed: ${message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
