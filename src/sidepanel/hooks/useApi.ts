import type { Result } from '@/shared/result';
import type { GetSessionMessage, SessionResponse } from '@/types/messages';
import { err } from '@/shared/result';
import { sfFetch } from '@/api/client';
import { query } from '@/api/soqlClient';
import { describeObject } from '@/api/describeClient';
import { getOrgInfo } from '@/api/orgInfo';

/**
 * Service Workerからセッション情報を取得する
 * （chrome.cookies APIはSW内でのみ動作するため）
 */
async function getSession(domain: string): Promise<Result<SessionResponse>> {
  try {
    const message: GetSessionMessage = {
      type: 'GET_SESSION',
      payload: { domain },
    };
    const result = await chrome.runtime.sendMessage(message) as Result<SessionResponse>;
    return result;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '不明なエラー';
    return err(`セッション取得失敗: ${message}`);
  }
}

/**
 * Side PanelからSalesforce APIを直接呼び出すヘルパー
 *
 * セッション取得のみSW経由、API呼出はSide Panelから直接fetch
 * （sf-custom-config-toolと同じ安定パターン）
 */
export async function callApi<T>(
  action: string,
  params: Record<string, unknown>
): Promise<Result<T>> {
  const domain = params['domain'] as string;
  if (!domain) return err('domain は必須です');

  // セッション取得（SW経由）
  const sessionResult = await getSession(domain);
  if (!sessionResult.ok) return err(sessionResult.error);

  const { sessionId, apiHostname } = sessionResult.data;

  // API呼出（Side Panelから直接fetch）
  switch (action) {
    case 'query': {
      const soql = params['soql'] as string;
      if (!soql) return err('soql は必須です');
      return query<T>(apiHostname, sessionId, soql) as Promise<Result<T>>;
    }

    case 'describe': {
      const objectApiName = params['objectApiName'] as string;
      if (!objectApiName) return err('objectApiName は必須です');
      return describeObject(apiHostname, sessionId, objectApiName) as Promise<Result<T>>;
    }

    case 'orgInfo': {
      return getOrgInfo(apiHostname, sessionId) as Promise<Result<T>>;
    }

    case 'createRecord': {
      const objectApiName = params['objectApiName'] as string;
      const data = params['data'] as Record<string, unknown>;
      if (!objectApiName || !data) return err('objectApiName, data は必須です');
      return sfFetch<T>(apiHostname, sessionId, `/sobjects/${objectApiName}/`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }

    case 'userInfo': {
      return sfFetch<T>(apiHostname, sessionId, '/chatter/users/me');
    }

    default:
      return err(`未知のAPIアクション: ${action}`);
  }
}
