import type { AiProviderMode, AiProviderSettings } from '@/types/appServer';
import { AI_PROVIDER_SETTINGS_KEY } from '@/types/appServer';
import { DEFAULT_AI_PROVIDER_SETTINGS } from '@/ai/core/types';

export { DEFAULT_AI_PROVIDER_SETTINGS } from '@/ai/core/types';

const AI_PROVIDER_MODES: AiProviderMode[] = [
  'local-only',
  'chrome-prompt-only',
  'hybrid',
];
const LEGACY_AI_PROVIDER_MODES = ['app-server-only'];

function isAiProviderMode(value: unknown): value is AiProviderMode {
  return typeof value === 'string' && AI_PROVIDER_MODES.includes(value as AiProviderMode);
}

function normalizeMode(value: unknown): AiProviderMode | null {
  if (isAiProviderMode(value)) return value;
  if (LEGACY_AI_PROVIDER_MODES.includes(String(value))) return 'local-only';
  return null;
}

function normalizeSettings(value: unknown): AiProviderSettings {
  if (!value || typeof value !== 'object') {
    return DEFAULT_AI_PROVIDER_SETTINGS;
  }

  const candidate = value as Partial<AiProviderSettings>;
  const mode = normalizeMode(candidate.mode);
  if (
    !mode ||
    typeof candidate.allowChromePromptInTools !== 'boolean'
  ) {
    return DEFAULT_AI_PROVIDER_SETTINGS;
  }

  return {
    mode,
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
