import type { Result } from '@/shared/result';
import type { SalesforceApiResponse } from '@/types/salesforceApi';
import type { SalesforceApiRequestMessage } from '@/types/messages';
import { err } from '@/shared/result';

/**
 * Side PanelからService Worker経由でSalesforce APIを呼び出すヘルパー。
 * sessionId は UI 側へ返さず、Service Worker 内でのみ扱う。
 */
export async function callApi<T>(
  action: string,
  params: Record<string, unknown>
): Promise<Result<T>> {
  const domain = params['domain'] as string;
  if (!domain) return err('domain は必須です');

  const apiParams = { ...params };
  delete apiParams['domain'];
  const message: SalesforceApiRequestMessage = {
    type: 'SALESFORCE_API_REQUEST',
    payload: {
      domain,
      action: action as SalesforceApiRequestMessage['payload']['action'],
      params: apiParams,
    },
  };

  try {
    return await chrome.runtime.sendMessage(message) as SalesforceApiResponse<T>;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '不明なエラー';
    return err(`Salesforce API proxy 通信失敗: ${message}`);
  }
}
