import { ok, err } from '@/shared/result';
import type { Result } from '@/shared/result';
import type {
  AiAvailability,
  AiAvailabilityStatus,
  AiProvider,
  AiRequest,
  AiResponse,
} from '../core/types';

type BuiltInAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available';

interface BuiltInLanguageModelSession {
  prompt(input: string, options?: { responseConstraint?: unknown }): Promise<string>;
  destroy(): void;
}

interface BuiltInLanguageModel {
  availability(options?: unknown): Promise<BuiltInAvailability>;
  create(options?: unknown): Promise<BuiltInLanguageModelSession>;
}

const DEFAULT_SYSTEM_PROMPT = [
  'You are a helpful AI assistant running inside a Chrome extension.',
  'Answer concisely in the requested locale.',
  'Do not request, repeat, or expose secrets such as sessionId, token, password, or authorization headers.',
].join('\n');

function getLanguageModel(): BuiltInLanguageModel | null {
  const maybeGlobal = globalThis as { LanguageModel?: BuiltInLanguageModel };
  return maybeGlobal.LanguageModel ?? null;
}

function toBuiltInOptions(request: AiRequest): Record<string, unknown> {
  const language = request.locale === 'ja-JP' ? 'ja' : 'en';
  return {
    expectedInputs: [{ type: 'text', languages: ['en', language] }],
    expectedOutputs: [{ type: 'text', languages: [language] }],
  };
}

function mapAvailability(status: BuiltInAvailability): AiAvailabilityStatus {
  return status === 'available' ? 'ready' : status;
}

function buildPrompt(request: AiRequest): string {
  return [
    request.prompt,
    request.data ? `\n入力データ:\n${JSON.stringify(request.data, null, 2)}` : '',
  ].join('\n');
}

export const chromePromptProvider: AiProvider = {
  id: 'chrome-prompt',

  async availability(request: AiRequest): Promise<AiAvailability> {
    const languageModel = getLanguageModel();
    if (!languageModel) {
      return {
        status: 'unavailable',
        reason: 'Chrome Prompt API (LanguageModel) がこのコンテキストで利用できません',
      };
    }

    try {
      const status = await languageModel.availability(toBuiltInOptions(request));
      return { status: mapAvailability(status) };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '不明なエラー';
      return { status: 'unavailable', reason: `Chrome Prompt API 確認失敗: ${message}` };
    }
  },

  async complete<T = unknown>(request: AiRequest): Promise<Result<AiResponse<T>>> {
    const languageModel = getLanguageModel();
    if (!languageModel) {
      return err('Chrome Prompt API (LanguageModel) がこのコンテキストで利用できません');
    }

    let session: BuiltInLanguageModelSession | null = null;
    try {
      session = await languageModel.create({
        ...toBuiltInOptions(request),
        initialPrompts: [
          {
            role: 'system',
            content: request.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
          },
        ],
      });

      const response = await session.prompt(
        buildPrompt(request),
        request.responseSchema ? { responseConstraint: request.responseSchema } : undefined
      );

      return ok({
        content: response,
        provider: 'chrome-prompt',
        model: 'Gemini Nano (Chrome Prompt API)',
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '不明なエラー';
      return err(`Chrome Prompt API 実行失敗: ${message}`);
    } finally {
      session?.destroy();
    }
  },
};
