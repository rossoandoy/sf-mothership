import { useEffect, useState } from 'react';
import type { OrgInfo } from '@/types/salesforce';
import type { PageContext } from '@/types/context';
import type { Result } from '@/shared/result';
import { callApi } from './useApi';

/**
 * 現在のOrgのOrganization情報を取得するフック
 */
export function useOrgInfo(context: PageContext | null): OrgInfo | null {
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [lastDomain, setLastDomain] = useState<string | null>(null);

  useEffect(() => {
    if (!context) {
      setOrgInfo(null);
      return;
    }

    // ドメインが変わった場合のみ再取得
    if (context.orgDomain === lastDomain && orgInfo) return;

    setLastDomain(context.orgDomain);

    callApi<OrgInfo>('orgInfo', { domain: context.orgDomain }).then(
      (result: Result<OrgInfo>) => {
        if (result.ok) {
          setOrgInfo(result.data);
        } else {
          // API失敗時はドメインベースの推定を使用
          setOrgInfo({
            id: '',
            name: context.orgDomain,
            isSandbox: context.isSandboxDomain,
            organizationType: 'unknown',
          });
        }
      }
    );
  }, [context?.orgDomain]);

  return orgInfo;
}
