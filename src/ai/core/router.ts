import { err } from '@/shared/result';
import type { Result } from '@/shared/result';
import {
  DEFAULT_AI_PROVIDER_SETTINGS,
  type AiProvider,
  type AiProviderId,
  type AiProviderSettings,
  type AiRequest,
  type AiResponse,
} from './types';
import { processAiOutput } from './output';

export type AiProviderRegistry = Record<AiProviderId, AiProvider>;

function normalizeMode(mode: AiProviderSettings['mode']): AiProviderSettings['mode'] {
  return mode === 'app-server-only' ? 'local-only' : mode;
}

export function getProviderOrder(
  request: AiRequest,
  settings: AiProviderSettings = DEFAULT_AI_PROVIDER_SETTINGS
): AiProviderId[] {
  const mode = normalizeMode(settings.mode);
  let order: AiProviderId[];

  if (mode === 'local-only') {
    order = request.privacy === 'onDeviceOnly' ? [] : ['local-http'];
  } else if (mode === 'chrome-prompt-only') {
    order = ['chrome-prompt'];
  } else if (request.privacy === 'onDeviceOnly') {
    order = ['chrome-prompt'];
  } else if (request.task === 'diagnostic-explain') {
    order = ['chrome-prompt', 'local-http'];
  } else {
    order = ['local-http', 'chrome-prompt'];
  }

  if (!settings.allowChromePromptInTools) {
    order = order.filter((providerId) => providerId !== 'chrome-prompt');
  }

  if (request.privacy === 'onDeviceOnly') {
    return order.filter((providerId) => providerId === 'chrome-prompt');
  }

  return order;
}

export async function generateAiWithProviders<T = unknown>(
  request: AiRequest,
  providers: AiProviderRegistry,
  settings: AiProviderSettings
): Promise<Result<AiResponse<T>>> {
  const errors: string[] = [];

  for (const providerId of getProviderOrder(request, settings)) {
    const provider = providers[providerId];
    const availability = await provider.availability(request);

    if (availability.status !== 'ready') {
      errors.push(`${providerId}: ${availability.reason ?? '利用できません'}`);
      continue;
    }

    const result = await provider.complete<T>(request);
    if (result.ok) {
      const outputResult = processAiOutput<T>(request, result.data);
      if (outputResult.ok) return outputResult;
      errors.push(`${providerId}: ${outputResult.error}`);
      continue;
    }
    errors.push(`${providerId}: ${result.error}`);
  }

  return err(errors.length > 0 ? errors.join(' / ') : 'AI provider を利用できません');
}
