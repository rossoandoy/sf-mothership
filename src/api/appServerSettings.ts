import type { AppServerSettings } from '@/types/appServer';
import { DEFAULT_APP_SERVER_URL, APP_SERVER_SETTINGS_KEY } from '@/types/appServer';

const DEFAULT_SETTINGS: AppServerSettings = {
  enabled: false,
  baseUrl: DEFAULT_APP_SERVER_URL,
};

export async function getAppServerSettings(): Promise<AppServerSettings> {
  try {
    const result = await chrome.storage.local.get(APP_SERVER_SETTINGS_KEY);
    const stored = result[APP_SERVER_SETTINGS_KEY] as AppServerSettings | undefined;
    return stored ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function setAppServerSettings(settings: AppServerSettings): Promise<void> {
  await chrome.storage.local.set({ [APP_SERVER_SETTINGS_KEY]: settings });
}

export function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}
