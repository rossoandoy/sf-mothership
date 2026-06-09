/**
 * 拡張コンテキストが有効かどうかを判定する。
 * 拡張リロード後に古い Content Script が残った場合は false になる。
 */
export function isExtensionContextValid(): boolean {
  try {
    return typeof chrome.runtime?.id === 'string';
  } catch {
    return false;
  }
}

/**
 * メッセージ送信を試みる。無効なコンテキストでは false を返す。
 */
export function safeSendMessage(message: unknown): boolean {
  if (!isExtensionContextValid()) {
    return false;
  }

  try {
    chrome.runtime.sendMessage(message).catch(() => {
      // Service Worker 再起動中は無視
    });
    return true;
  } catch {
    return false;
  }
}
