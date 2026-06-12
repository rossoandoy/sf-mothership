import type { AiProviderMode, AiProviderSettings } from '@/types/appServer';
import { AI_PROVIDER_SETTINGS_KEY } from '@/types/appServer';

export const DEFAULT_AI_PROVIDER_SETTINGS: AiProviderSettings = {
  mode: 'app-server-only',
  allowChromePromptInTools: false,
};

const AI_PROVIDER_MODES: AiProviderMode[] = [
  'app-server-only',
  'chrome-prompt-only',
  'hybrid',
];

function isAiProviderMode(value: unknown): value is AiProviderMode {
  return typeof value === 'string' && AI_PROVIDER_MODES.includes(value as AiProviderMode);
}

function normalizeSettings(value: unknown): AiProviderSettings {
  if (!value || typeof value !== 'object') {
    return DEFAULT_AI_PROVIDER_SETTINGS;
  }

  const candidate = value as Partial<AiProviderSettings>;
  if (
    !isAiProviderMode(candidate.mode) ||
    typeof candidate.allowChromePromptInTools !== 'boolean'
  ) {
    return DEFAULT_AI_PROVIDER_SETTINGS;
  }

  return {
    mode: candidate.mode,
    allowChromePromptInTools: candidate.allowChromePromptInTools,
  };
}

export async function getAiProviderSettings(): Promise<AiProviderSettings> {
  try {
    const result = await chrome.storage.local.get(AI_PROVIDER_SETTINGS_KEY);
    return normalizeSettings(result[AI_PROVIDER_SETTINGS_KEY]);
  } catch {
    return DEFAULT_AI_PROVIDER_SETTINGS;
  }
}

export async function setAiProviderSettings(settings: AiProviderSettings): Promise<void> {
  await chrome.storage.local.set({
    [AI_PROVIDER_SETTINGS_KEY]: normalizeSettings(settings),
  });
}
