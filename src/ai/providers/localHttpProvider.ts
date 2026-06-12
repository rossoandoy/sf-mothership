import { ok, err } from '@/shared/result';
import type { Result } from '@/shared/result';
import type { AiAvailability, AiProvider, AiRequest, AiResponse } from '../core/types';
import { checkAppServerHealth, sendAppServerChat } from '@/api/appServerClient';

export const localHttpProvider: AiProvider = {
  id: 'local-http',

  async availability(): Promise<AiAvailability> {
    const health = await checkAppServerHealth();
    if (!health.ok) {
      return { status: 'unavailable', reason: health.error };
    }
    if (health.data.status !== 'ok') {
      return { status: 'unavailable', reason: health.data.message ?? 'Local AI Provider が利用できません' };
    }
    return { status: 'ready' };
  },

  async complete<T = unknown>(request: AiRequest): Promise<Result<AiResponse<T>>> {
    if (request.privacy === 'onDeviceOnly') {
      return err('このリクエストはオンデバイス限定のため Local AI Provider へ送信できません');
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
      provider: 'local-http',
      model: result.data.model,
    });
  },
};
