import type { Result } from '@/shared/result';
import { ok, err } from '@/shared/result';
import type { AiProvider, AiRequest, AiResponse, AiAvailability, AiAvailabilityStatus } from './aiProvider';

type BuiltInAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available';

interface BuiltInLanguageModelSession {
  prompt(input: string, options?: { responseConstraint?: unknown }): Promise<string>;
  destroy(): void;
}

interface BuiltInLanguageModel {
  availability(options?: unknown): Promise<BuiltInAvailability>;
  create(options?: unknown): Promise<BuiltInLanguageModelSession>;
}

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

export const chromeBuiltInAiProvider: AiProvider = {
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
            content: [
              'あなたはSalesforce導入支援Chrome拡張 SF Mothership の補助AIです。',
              '日本語で簡潔に答えてください。',
              'sessionId、token、password、authorization などの機密情報を要求・出力しないでください。',
            ].join('\n'),
          },
        ],
      });

      const response = await session.prompt(
        [
          request.prompt,
          request.data ? `\n入力データ:\n${JSON.stringify(request.data, null, 2)}` : '',
        ].join('\n'),
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
