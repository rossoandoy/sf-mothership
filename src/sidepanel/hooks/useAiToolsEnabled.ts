import { useEffect, useState } from 'react';
import { getAppServerSettings } from '@/api/appServerSettings';
import { getAiProviderSettings } from '@/api/aiProviderSettings';
import { AI_PROVIDER_SETTINGS_KEY, APP_SERVER_SETTINGS_KEY } from '@/types/appServer';
import type { AiProviderSettings, AppServerSettings } from '@/types/appServer';

export function canUseAiTools(
  localProvider: AppServerSettings,
  aiProvider: AiProviderSettings
): boolean {
  if (aiProvider.mode === 'chrome-prompt-only') {
    return aiProvider.allowChromePromptInTools;
  }

  if (aiProvider.mode === 'hybrid') {
    return localProvider.enabled || aiProvider.allowChromePromptInTools;
  }

  return localProvider.enabled;
}

export function useAiToolsEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const refresh = async () => {
      const [localProvider, aiProvider] = await Promise.all([
        getAppServerSettings(),
        getAiProviderSettings(),
      ]);
      setEnabled(canUseAiTools(localProvider, aiProvider));
    };

    refresh();

    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes[APP_SERVER_SETTINGS_KEY] || changes[AI_PROVIDER_SETTINGS_KEY]) {
        refresh();
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return enabled;
}
