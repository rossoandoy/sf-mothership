import type { Result } from '@/shared/result';
import type { OrgInfo, SoqlResponse } from '@/types/salesforce';
import { ok, err } from '@/shared/result';
import { sfFetch } from './client';
import { withCache } from '@/shared/cache';

const ORG_INFO_TTL_MS = 24 * 60 * 60 * 1000; // 24時間

interface OrgRecord {
  Id: string;
  Name: string;
  IsSandbox: boolean;
  OrganizationType: string;
}

/**
 * Org情報を取得する（sandbox判定含む、24時間キャッシュ）
 */
export async function getOrgInfo(
  apiHostname: string,
  sessionId: string
): Promise<Result<OrgInfo>> {
  const cacheKey = `orginfo_${apiHostname}`;

  return withCache<OrgInfo>(
    cacheKey,
    ORG_INFO_TTL_MS,
    async () => {
      const result = await sfFetch<SoqlResponse<OrgRecord>>(
        apiHostname,
        sessionId,
        '/query?q=' + encodeURIComponent('SELECT Id, Name, IsSandbox, OrganizationType FROM Organization')
      );

      if (!result.ok) return err(result.error);

      const org = result.data.records[0];
      if (!org) return err('Organization情報の取得に失敗しました');

      return ok({
        id: org.Id,
        name: org.Name,
        isSandbox: org.IsSandbox,
        organizationType: org.OrganizationType,
      });
    }
  );
}
