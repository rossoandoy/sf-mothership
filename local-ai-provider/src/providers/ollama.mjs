export const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434';
export const DEFAULT_OLLAMA_MODEL = 'llama3.2:3b';

function buildOllamaPrompt(request) {
  return [
    `Task: ${request.task ?? 'unknown'}`,
    '',
    'Instruction:',
    request.prompt ?? '',
    '',
    'Context:',
    JSON.stringify(request.context ?? {}, null, 2),
    '',
    'Data:',
    JSON.stringify(request.data ?? {}, null, 2),
  ].join('\n');
}

export function createOllamaProvider({
  baseUrl = process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_URL,
  model = process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL,
  fetchImpl = globalThis.fetch,
} = {}) {
  return {
    id: 'ollama',

    async complete(request) {
      if (typeof fetchImpl !== 'function') {
        throw new Error('fetch is not available in this Node.js runtime.');
      }

      let response;
      try {
        response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            model,
            prompt: buildOllamaPrompt(request),
            stream: false,
          }),
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'unknown error';
        throw new Error(`Ollama is not reachable at ${baseUrl}. ${message}`);
      }

      if (!response.ok) {
        const detail = await response.text().catch(() => response.statusText);
        throw new Error(`Ollama returned HTTP ${response.status}: ${detail}`);
      }

      const body = await response.json();
      if (!body || typeof body.response !== 'string') {
        throw new Error('Ollama response did not include a text response.');
      }

      return {
        content: body.response,
        model,
      };
    },
  };
}
