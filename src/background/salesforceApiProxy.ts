import type { Result } from '@/shared/result';
import { err } from '@/shared/result';
import type { SalesforceApiRequestPayload } from '@/types/salesforceApi';
import { getSessionId } from '@/api/auth';
import { query } from '@/api/soqlClient';
import { describeObject } from '@/api/describeClient';
import { getOrgInfo } from '@/api/orgInfo';
import { sfFetch } from '@/api/client';

export interface SalesforceApiProxyDeps {
  getSessionId: (domain: string) => Promise<Result<{ sessionId: string; apiHostname: string }>>;
  query: (apiHostname: string, sessionId: string, soql: string) => Promise<Result<unknown>>;
  describeObject: (apiHostname: string, sessionId: string, objectApiName: string) => Promise<Result<unknown>>;
  getOrgInfo: (apiHostname: string, sessionId: string) => Promise<Result<unknown>>;
  sfFetch: (
    apiHostname: string,
    sessionId: string,
    path: string,
    options?: RequestInit,
    apiVersion?: string
  ) => Promise<Result<unknown>>;
}

const defaultDeps: SalesforceApiProxyDeps = {
  getSessionId,
  query,
  describeObject,
  getOrgInfo,
  sfFetch,
};

export async function handleSalesforceApiRequest<T = unknown>(
  payload: SalesforceApiRequestPayload,
  deps: SalesforceApiProxyDeps = defaultDeps
): Promise<Result<T>> {
  if (!payload.domain) return err('domain は必須です');

  const validationError = validatePayload(payload);
  if (validationError) return err(validationError);

  const sessionResult = await deps.getSessionId(payload.domain);
  if (!sessionResult.ok) return err(sessionResult.error);

  const { sessionId, apiHostname } = sessionResult.data;

  switch (payload.action) {
    case 'query': {
      const soql = payload.params['soql'] as string;
      return deps.query(apiHostname, sessionId, soql) as Promise<Result<T>>;
    }

    case 'describe': {
      const objectApiName = payload.params['objectApiName'] as string;
      return deps.describeObject(apiHostname, sessionId, objectApiName) as Promise<Result<T>>;
    }

    case 'orgInfo': {
      return deps.getOrgInfo(apiHostname, sessionId) as Promise<Result<T>>;
    }

    case 'createRecord': {
      const objectApiName = payload.params['objectApiName'] as string;
      const data = payload.params['data'] as Record<string, unknown>;
      return deps.sfFetch(apiHostname, sessionId, `/sobjects/${objectApiName}/`, {
        method: 'POST',
        body: JSON.stringify(data),
      }) as Promise<Result<T>>;
    }

    case 'userInfo': {
      return deps.sfFetch(apiHostname, sessionId, '/chatter/users/me') as Promise<Result<T>>;
    }

    default:
      return err(`未知のAPIアクション: ${String(payload.action)}`);
  }
}

function validatePayload(payload: SalesforceApiRequestPayload): string | null {
  switch (payload.action) {
    case 'query':
      return typeof payload.params['soql'] === 'string' && payload.params['soql']
        ? null
        : 'soql は必須です';

    case 'describe':
      return typeof payload.params['objectApiName'] === 'string' && payload.params['objectApiName']
        ? null
        : 'objectApiName は必須です';

    case 'createRecord':
      if (typeof payload.params['objectApiName'] !== 'string' || !payload.params['objectApiName']) {
        return 'objectApiName, data は必須です';
      }
      if (!payload.params['data'] || typeof payload.params['data'] !== 'object') {
        return 'objectApiName, data は必須です';
      }
      return null;

    case 'orgInfo':
    case 'userInfo':
      return null;

    default:
      return `未知のAPIアクション: ${String(payload.action)}`;
  }
}
