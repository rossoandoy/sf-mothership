import type { Result } from '@/shared/result';
import { getProviderOrder as getCoreProviderOrder, generateAiWithProviders } from '@/ai/core/router';
import type {
  AiAvailability,
  AiAvailabilityStatus,
  AiPrivacy,
  AiProvider,
  AiProviderId,
  AiProviderSettings,
  AiRequest,
  AiResponse,
  AiTask,
} from '@/ai/core/types';
import { chromePromptProvider } from '@/ai/providers/chromePromptProvider';
import { localHttpProvider } from '@/ai/providers/localHttpProvider';
import { DEFAULT_AI_PROVIDER_SETTINGS, getAiProviderSettings } from './aiProviderSettings';

export type {
  AiAvailability,
  AiAvailabilityStatus,
  AiPrivacy,
  AiProvider,
  AiProviderId,
  AiProviderSettings,
  AiRequest,
  AiResponse,
  AiTask,
};

const SALESFORCE_SYSTEM_PROMPT = [
  'あなたはSalesforce導入支援Chrome拡張 SF Mothership の補助AIです。',
  '日本語で簡潔に答えてください。',
  'Salesforceの設定変更やデータ更新は、ユーザー確認なしに実行できるかのように説明しないでください。',
  'sessionId、token、password、authorization などの機密情報を要求・出力しないでください。',
].join('\n');

const PROVIDERS: Record<AiProviderId, AiProvider> = {
  'chrome-prompt': chromePromptProvider,
  'local-http': localHttpProvider,
};

function withSalesforceDefaults(request: AiRequest): AiRequest {
  return {
    ...request,
    systemPrompt: request.systemPrompt ?? SALESFORCE_SYSTEM_PROMPT,
  };
}

export function getProviderOrder(
  request: AiRequest,
  settings: AiProviderSettings = DEFAULT_AI_PROVIDER_SETTINGS
): AiProviderId[] {
  return getCoreProviderOrder(request, settings);
}

export async function generateAi<T = unknown>(
  request: AiRequest
): Promise<Result<AiResponse<T>>> {
  const settings = await getAiProviderSettings();
  return generateAiWithProviders<T>(withSalesforceDefaults(request), PROVIDERS, settings);
}

export async function checkChromePromptAvailability(): Promise<AiAvailability> {
  return chromePromptProvider.availability(withSalesforceDefaults({
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
  }));
}

export async function runChromePromptSmokeTest(): Promise<Result<AiResponse>> {
  return chromePromptProvider.complete(withSalesforceDefaults({
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
  }));
}

export function getProviderDestinationLabel(providerId: AiProviderId | 'app-server'): string {
  return providerId === 'chrome-prompt'
    ? 'オンデバイス処理'
    : 'localhost Local AI Provider';
}
