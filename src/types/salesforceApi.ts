import type { Result } from '@/shared/result';

export type SalesforceApiAction =
  | 'query'
  | 'describe'
  | 'orgInfo'
  | 'createRecord'
  | 'userInfo';

export interface SalesforceApiRequestPayload {
  domain: string;
  action: SalesforceApiAction;
  params: Record<string, unknown>;
}

export type SalesforceApiResponse<T> = Result<T>;
