import type { Result } from '@/shared/result';

export type AiTask = string;
export type AiProviderId = 'chrome-prompt' | 'local-http';
export type AiProviderMode = 'local-only' | 'app-server-only' | 'chrome-prompt-only' | 'hybrid';
export type AiPrivacy = 'onDeviceOnly' | 'localServerAllowed';
export type AiAvailabilityStatus = 'ready' | 'downloadable' | 'downloading' | 'unavailable';
export type AiOutputMode = 'text' | 'json' | 'draft';

export interface AiAvailability {
  status: AiAvailabilityStatus;
  reason?: string;
}

export interface AiRequest {
  task: AiTask;
  prompt: string;
  context: unknown;
  data?: unknown;
  locale: 'ja-JP' | 'en-US';
  privacy: AiPrivacy;
  outputMode?: AiOutputMode;
  responseSchema?: unknown;
  systemPrompt?: string;
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

export interface AiProviderSettings {
  mode: AiProviderMode;
  allowChromePromptInTools: boolean;
}

export const DEFAULT_AI_PROVIDER_SETTINGS: AiProviderSettings = {
  mode: 'local-only',
  allowChromePromptInTools: false,
};
