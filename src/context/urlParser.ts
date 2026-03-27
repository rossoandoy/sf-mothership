import type { PageContext, PageType } from '@/types/context';

/**
 * Salesforce Lightning URLを解析してPageContextを生成する純関数
 *
 * 対応パターン:
 * - /lightning/r/{ObjectApiName}/{RecordId}/view → recordPage
 * - /lightning/r/{ObjectApiName}/{RecordId}/related/... → recordPage
 * - /lightning/o/{ObjectApiName}/list → objectHome
 * - /lightning/o/{ObjectApiName}/home → objectHome
 * - /lightning/setup/... → setupPage
 * - それ以外 → other
 */
export function parseUrl(url: string): PageContext {
  const parsed = new URL(url);
  const hostname = parsed.hostname;
  const pathname = parsed.pathname;

  const orgDomain = hostname;
  const isSandboxDomain = detectSandbox(hostname);

  // レコードページ: /lightning/r/{Object}/{RecordId}/view (or /related/...)
  const recordMatch = pathname.match(
    /^\/lightning\/r\/([A-Za-z0-9_]+)\/([a-zA-Z0-9]{15,18})(?:\/|$)/
  );
  if (recordMatch) {
    return {
      orgDomain,
      objectApiName: recordMatch[1] ?? null,
      recordId: recordMatch[2] ?? null,
      pageType: 'recordPage',
      url,
      isSandboxDomain,
      timestamp: Date.now(),
    };
  }

  // オブジェクトホーム: /lightning/o/{Object}/list or /home
  const objectHomeMatch = pathname.match(
    /^\/lightning\/o\/([A-Za-z0-9_]+)\/(?:list|home)(?:\/|$|\?)/
  );
  if (objectHomeMatch) {
    return {
      orgDomain,
      objectApiName: objectHomeMatch[1] ?? null,
      recordId: null,
      pageType: 'objectHome',
      url,
      isSandboxDomain,
      timestamp: Date.now(),
    };
  }

  // Setup画面: /lightning/setup/...
  if (pathname.startsWith('/lightning/setup/')) {
    return {
      orgDomain,
      objectApiName: null,
      recordId: null,
      pageType: 'setupPage',
      url,
      isSandboxDomain,
      timestamp: Date.now(),
    };
  }

  // その他
  return {
    orgDomain,
    objectApiName: null,
    recordId: null,
    pageType: 'other' as PageType,
    url,
    isSandboxDomain,
    timestamp: Date.now(),
  };
}

/**
 * ドメインからSandboxかどうかを推定する
 *
 * Sandboxパターン:
 * - *.sandbox.my.salesforce.com
 * - *--sandbox*.sandbox.lightning.force.com
 * - ドメインに "--" + sandbox名 が含まれるケース
 */
function detectSandbox(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  // .sandbox. を含む
  if (lower.includes('.sandbox.')) return true;

  // --{sandbox名} パターン（例: mycompany--dev.sandbox.lightning.force.com）
  if (lower.includes('--') && lower.includes('.lightning.force.com')) return true;

  // cs(数字) ドメイン（旧sandbox識別、レガシー）
  if (/^cs\d+\./.test(lower)) return true;

  return false;
}

/**
 * URLがSalesforceドメインかどうかを判定する
 */
export function isSalesforceUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return (
      hostname.endsWith('.salesforce.com') ||
      hostname.endsWith('.force.com') ||
      hostname.endsWith('.salesforce-setup.com')
    );
  } catch {
    return false;
  }
}
