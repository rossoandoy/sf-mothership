import type { Result } from '@/shared/result';
import { ok, err } from '@/shared/result';
import { logger } from '@/shared/logger';

/**
 * Lightningドメイン等をAPIホスト名（*.my.salesforce.com）に変換する
 *
 * 例:
 *   "mycompany.lightning.force.com" → "mycompany.my.salesforce.com"
 *   "mycompany--sandbox.sandbox.lightning.force.com" → "mycompany--sandbox.sandbox.my.salesforce.com"
 *   "mycompany.my.salesforce.com" → "mycompany.my.salesforce.com" (そのまま)
 */
export function toApiHostname(hostname: string): string {
  const lower = hostname.toLowerCase();

  // 既にAPIホスト名の場合はそのまま
  if (lower.endsWith('.my.salesforce.com')) return hostname;

  // Lightning: xxx.lightning.force.com → xxx.my.salesforce.com
  const lightningMatch = lower.match(/^(.+)\.lightning\.force\.com$/);
  if (lightningMatch?.[1]) {
    return `${lightningMatch[1]}.my.salesforce.com`;
  }

  // Sandbox Lightning: xxx.sandbox.lightning.force.com → xxx.sandbox.my.salesforce.com
  const sandboxLightningMatch = lower.match(/^(.+)\.sandbox\.lightning\.force\.com$/);
  if (sandboxLightningMatch?.[1]) {
    return `${sandboxLightningMatch[1]}.sandbox.my.salesforce.com`;
  }

  // VisualForce: xxx.vf.force.com → APIホストへの変換が難しいので元のドメインで試行
  // force.com一般: そのまま返す
  return hostname;
}

/**
 * chrome.cookies APIを使ってSalesforceのセッションIDを取得する
 * Service Worker内でのみ動作する
 *
 * 1. APIホスト名に変換してcookie取得を試行
 * 2. 失敗したら全Salesforceドメインからsid cookieをスキャン
 */
export async function getSessionId(domain: string): Promise<Result<{ sessionId: string; apiHostname: string }>> {
  try {
    // Step 1: APIホスト名でcookieを取得
    const apiHost = toApiHostname(domain);
    const cookie = await chrome.cookies.get({
      url: `https://${apiHost}`,
      name: 'sid',
    });

    if (cookie?.value) {
      logger.debug('セッションID取得成功 (直接)', { apiHost });
      return ok({ sessionId: cookie.value, apiHostname: apiHost });
    }

    // Step 2: 元のドメインで試行
    if (apiHost !== domain) {
      const originalCookie = await chrome.cookies.get({
        url: `https://${domain}`,
        name: 'sid',
      });

      if (originalCookie?.value) {
        logger.debug('セッションID取得成功 (元ドメイン)', { domain });
        return ok({ sessionId: originalCookie.value, apiHostname: domain });
      }
    }

    // Step 3: フォールバック — 全sid cookieをスキャン
    const allCookies = await chrome.cookies.getAll({ name: 'sid' });
    const sfCookie = allCookies.find((c) => {
      const d = c.domain.toLowerCase();
      return (
        d.endsWith('.salesforce.com') ||
        d.endsWith('.force.com')
      );
    });

    if (sfCookie?.value) {
      // cookieのdomainからAPIホスト名を推定
      const cookieHost = sfCookie.domain.startsWith('.')
        ? sfCookie.domain.slice(1)
        : sfCookie.domain;
      const resolvedHost = toApiHostname(cookieHost);
      logger.debug('セッションID取得成功 (フォールバック)', { cookieHost: resolvedHost });
      return ok({ sessionId: sfCookie.value, apiHostname: resolvedHost });
    }

    return err('Salesforceにログインしていません。ブラウザでSalesforceにログインしてください。');
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '不明なエラー';
    return err(`セッション取得に失敗しました: ${message}`);
  }
}
