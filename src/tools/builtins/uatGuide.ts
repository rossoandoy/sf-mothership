import type { ToolHandler, ToolResult } from '@/types/tool';
import type { SoqlResponse, SObjectRecord } from '@/types/salesforce';
import { ok } from '@/shared/result';
import { callApi } from '@/sidepanel/hooks/useApi';
import { escapeSOQL, isValidRecordId } from '@/api/soqlClient';

export interface GuideEntry {
  id: string;
  pageMatch: string[];
  objectMatch: string[];
  recordTypeMatch?: string[];
  title: string;
  sections: Array<{
    heading: string;
    items: string[];
  }>;
}

let guides: GuideEntry[] = [];

export function setGuides(data: GuideEntry[]): void {
  guides = data;
}

export function getGuides(): GuideEntry[] {
  return guides;
}

/**
 * レコードの RecordType DeveloperName を取得（recordTypeMatch 用）
 */
async function fetchRecordTypeDeveloperName(
  orgDomain: string,
  objectApiName: string,
  recordId: string
): Promise<string | null> {
  if (!isValidRecordId(recordId)) return null;

  const soql = `SELECT RecordType.DeveloperName FROM ${objectApiName} WHERE Id = '${escapeSOQL(recordId)}' LIMIT 1`;
  const result = await callApi<SoqlResponse<SObjectRecord & { RecordType?: { DeveloperName: string } }>>(
    'query',
    { domain: orgDomain, soql }
  );

  if (!result.ok) return null;

  const record = result.data.records[0];
  const rt = record?.RecordType;
  if (rt && typeof rt === 'object' && 'DeveloperName' in rt) {
    return String((rt as { DeveloperName: string }).DeveloperName);
  }
  return null;
}

export const uatGuideHandler: ToolHandler = async (ctx) => {
  const { pageContext } = ctx;
  const { objectApiName, pageType, orgDomain, recordId } = pageContext;

  let recordTypeDeveloperName: string | null = null;
  if (pageType === 'recordPage' && objectApiName && recordId) {
    recordTypeDeveloperName = await fetchRecordTypeDeveloperName(orgDomain, objectApiName, recordId);
  }

  const matchedGuides = guides.filter((guide) => {
    if (!guide.pageMatch.includes(pageType)) return false;

    if (
      objectApiName &&
      !guide.objectMatch.includes('*') &&
      !guide.objectMatch.includes(objectApiName)
    ) {
      return false;
    }

    if (guide.recordTypeMatch && guide.recordTypeMatch.length > 0) {
      if (!recordTypeDeveloperName) return false;
      if (!guide.recordTypeMatch.includes(recordTypeDeveloperName)) return false;
    }

    return true;
  });

  if (matchedGuides.length === 0) {
    return ok({
      outputType: 'guidePanel',
      data: {
        title: 'ガイドなし',
        sections: [
          {
            heading: '',
            items: ['この画面に対応するUATガイドは登録されていません。'],
          },
        ],
      },
    } as ToolResult);
  }

  const allSections = matchedGuides.flatMap((g) => g.sections);

  return ok({
    outputType: 'guidePanel',
    data: {
      title: matchedGuides.length === 1
        ? (matchedGuides[0]?.title ?? 'UAT ガイド')
        : `UAT ガイド (${matchedGuides.length}件マッチ)`,
      sections: allSections,
    },
  } as ToolResult);
};
