import type { Result } from '@/shared/result';
import type { AppServerChatRequest, AppServerChatResponse } from '@/types/appServer';
import { sendAppServerChat } from './appServerClient';

export function buildLocalProviderSmokeRequest(): AppServerChatRequest {
  return {
    task: 'diagnostic-explain',
    prompt: 'SF Mothership の Local AI Provider smoke test として、日本語で短く「利用可能です」と返してください。',
    context: {
      orgDomain: 'local-smoke',
      objectApiName: null,
      recordId: null,
      pageType: 'other',
      isSandbox: true,
    },
    data: {
      source: 'options-local-provider-smoke',
    },
  };
}

export async function runLocalProviderSmokeTest(): Promise<Result<AppServerChatResponse>> {
  return sendAppServerChat(buildLocalProviderSmokeRequest());
}
