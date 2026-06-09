import { useEffect, useState } from 'react';
import type { PageContext } from '@/types/context';
import { isExtensionContextValid } from '@/shared/extensionContext';

const STALE_DELAY_MS = 3000;

/**
 * 拡張リロード後にコンテキストが取得できない状態を検出する
 */
export function useExtensionStale(context: PageContext | null): boolean {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if (context) {
      setStale(false);
      return;
    }

    if (!isExtensionContextValid()) {
      setStale(true);
      return;
    }

    const timer = setTimeout(() => {
      setStale(true);
    }, STALE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [context]);

  return stale;
}
