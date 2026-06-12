import type { Result } from '@/shared/result';
import { err } from '@/shared/result';
import type { AiProviderSettings, SafeContextPayload } from '@/types/appServer';
import { appServerAiProvider } from './appServerAiProvider';
import { chromeBuiltInAiProvider } from './chromeBuiltInAiProvider';
import { DEFAULT_AI_PROVIDER_SETTINGS, getAiProviderSettings } from './aiProviderSettings';

export type AiTask = 'tool-definition' | 'diagnostic-explain' | 'report-analyze';
export type AiProviderId = 'chrome-prompt' | 'app-server';
export type AiPrivacy = 'onDeviceOnly' | 'localServerAllowed';
export type AiAvailabilityStatus = 'ready' | 'downloadable' | 'downloading' | 'unavailable';

export interface AiAvailability {
  status: AiAvailabilityStatus;
  reason?: string;
}

export interface AiRequest {
  task: AiTask;
  prompt: string;
  context: SafeContextPayload;
  data?: Record<string, unknown>;
  locale: 'ja-JP' | 'en-US';
  privacy: AiPrivacy;
  responseSchema?: unknown;
}

export interface AiResponse<T = unknown> {
  content: string;
  parsed?: T;
  provider: AiProviderId;
  model?: string;
  warnings?: string[];
}

export interface AiProvider {
  id: AiProviderId;
  availability(request: AiRequest): Promise<AiAvailability>;
  complete<T = unknown>(request: AiRequest): Promise<Result<AiResponse<T>>>;
}

const PROVIDERS: Record<AiProviderId, AiProvider> = {
  'chrome-prompt': chromeBuiltInAiProvider,
  'app-server': appServerAiProvider,
};

export function getProviderOrder(
  request: AiRequest,
  settings: AiProviderSettings = DEFAULT_AI_PROVIDER_SETTINGS
): AiProviderId[] {
  let order: AiProviderId[];

  if (settings.mode === 'app-server-only') {
    order = request.privacy === 'onDeviceOnly' ? [] : ['app-server'];
  } else if (settings.mode === 'chrome-prompt-only') {
    order = ['chrome-prompt'];
  } else if (request.privacy === 'onDeviceOnly') {
    order = ['chrome-prompt'];
  } else if (request.task === 'diagnostic-explain') {
    order = ['chrome-prompt', 'app-server'];
  } else {
    order = ['app-server', 'chrome-prompt'];
  }

  if (!settings.allowChromePromptInTools) {
    order = order.filter((providerId) => providerId !== 'chrome-prompt');
  }

  if (request.privacy === 'onDeviceOnly') {
    return order.filter((providerId) => providerId === 'chrome-prompt');
  }

  return order;
}

export async function generateAi<T = unknown>(
  request: AiRequest
): Promise<Result<AiResponse<T>>> {
  const errors: string[] = [];
  const settings = await getAiProviderSettings();

  for (const providerId of getProviderOrder(request, settings)) {
    const provider = PROVIDERS[providerId];
    const availability = await provider.availability(request);

    if (availability.status !== 'ready') {
      errors.push(`${providerId}: ${availability.reason ?? '利用できません'}`);
      continue;
    }

    const result = await provider.complete<T>(request);
    if (result.ok) {
      return result;
    }
    errors.push(`${providerId}: ${result.error}`);
  }

  return err(errors.length > 0 ? errors.join(' / ') : 'AI provider を利用できません');
}

export async function checkChromePromptAvailability(): Promise<AiAvailability> {
  return chromeBuiltInAiProvider.availability({
    task: 'diagnostic-explain',
    prompt: '',
    context: {
      orgDomain: 'local',
      objectApiName: null,
      recordId: null,
      pageType: 'other',
      isSandbox: true,
    },
    locale: 'ja-JP',
    privacy: 'onDeviceOnly',
  });
}

export async function runChromePromptSmokeTest(): Promise<Result<AiResponse>> {
  return chromeBuiltInAiProvider.complete({
    task: 'diagnostic-explain',
    prompt: 'SF Mothership の Chrome Built-in AI PoC として、日本語で短く「利用可能です」と返してください。',
    context: {
      orgDomain: 'local',
      objectApiName: null,
      recordId: null,
      pageType: 'other',
      isSandbox: true,
    },
    locale: 'ja-JP',
    privacy: 'onDeviceOnly',
  });
}

export function getProviderDestinationLabel(providerId: AiProviderId): string {
  return providerId === 'chrome-prompt'
    ? 'オンデバイス処理'
    : 'localhost App Server';
}
