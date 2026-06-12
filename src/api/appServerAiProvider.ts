import type { Result } from '@/shared/result';
import { ok, err } from '@/shared/result';
import type { AiProvider, AiRequest, AiResponse, AiAvailability } from './aiProvider';
import { checkAppServerHealth, sendAppServerChat } from './appServerClient';

export const appServerAiProvider: AiProvider = {
  id: 'app-server',

  async availability(): Promise<AiAvailability> {
    const health = await checkAppServerHealth();
    if (!health.ok) {
      return { status: 'unavailable', reason: health.error };
    }
    if (health.data.status !== 'ok') {
      return { status: 'unavailable', reason: health.data.message ?? 'App Server が利用できません' };
    }
    return { status: 'ready' };
  },

  async complete<T = unknown>(request: AiRequest): Promise<Result<AiResponse<T>>> {
    if (request.privacy === 'onDeviceOnly') {
      return err('このリクエストはオンデバイス限定のため App Server へ送信できません');
    }

    const result = await sendAppServerChat({
      task: request.task,
      prompt: request.prompt,
      context: request.context,
      data: request.data,
    });

    if (!result.ok) return err(result.error);

    return ok({
      content: result.data.content,
      provider: 'app-server',
      model: result.data.model,
    });
  },
};
