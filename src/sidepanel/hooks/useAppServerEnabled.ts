import { useEffect, useState } from 'react';
import { getAppServerSettings } from '@/api/appServerSettings';

export function useAppServerEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    getAppServerSettings().then((s) => setEnabled(s.enabled));

    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes['app_server_settings']) {
        const next = changes['app_server_settings'].newValue as { enabled?: boolean } | undefined;
        setEnabled(next?.enabled ?? false);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return enabled;
}
