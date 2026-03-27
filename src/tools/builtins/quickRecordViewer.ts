import type { ToolHandler, ToolResult, CardData } from '@/types/tool';
import type { SObjectRecord, SoqlResponse, DescribeResult } from '@/types/salesforce';
import { ok, err } from '@/shared/result';
import { callApi } from '@/sidepanel/hooks/useApi';

export const quickRecordViewerHandler: ToolHandler = async (ctx) => {
  const { pageContext } = ctx;
  const { orgDomain, objectApiName, recordId } = pageContext;

  if (!objectApiName || !recordId) {
    return err('レコードページ以外では使用できません');
  }

  // レコード基本情報を取得
  const soql = `SELECT Id, Name, CreatedDate, LastModifiedDate, CreatedBy.Name, LastModifiedBy.Name, Owner.Name FROM ${objectApiName} WHERE Id = '${recordId}'`;
  const recordResult = await callApi<SoqlResponse<SObjectRecord>>(
    'query',
    { domain: orgDomain, soql }
  );

  if (!recordResult.ok) return err(recordResult.error);

  const record = recordResult.data.records[0];
  if (!record) return err('レコードが見つかりません');

  // 関連リスト件数を取得
  const describeResult = await callApi<DescribeResult>(
    'describe',
    { domain: orgDomain, objectApiName }
  );

  const relatedCounts: Array<{ label: string; count: number }> = [];

  if (describeResult.ok) {
    const relationships = describeResult.data.childRelationships
      .filter(r => r.relationshipName && !r.deprecatedAndHidden)
      .slice(0, 5);

    for (const rel of relationships) {
      const countSoql = `SELECT COUNT() FROM ${rel.childSObject} WHERE ${rel.field} = '${recordId}'`;
      const countResult = await callApi<{ totalSize: number }>(
        'query',
        { domain: orgDomain, soql: countSoql }
      );
      if (countResult.ok) {
        relatedCounts.push({
          label: rel.relationshipName ?? rel.childSObject,
          count: countResult.data.totalSize,
        });
      }
    }
  }

  const cardData: CardData = {
    title: `${String(record.Name ?? recordId)}`,
    sections: [
      {
        heading: '基本情報',
        items: [
          { label: 'ID', value: String(record.Id) },
          { label: 'Name', value: String(record.Name ?? '(なし)') },
          { label: '作成日', value: formatDate(record.CreatedDate as string) },
          { label: '更新日', value: formatDate(record.LastModifiedDate as string) },
          { label: '作成者', value: getNestedName(record, 'CreatedBy') },
          { label: '更新者', value: getNestedName(record, 'LastModifiedBy') },
          { label: '所有者', value: getNestedName(record, 'Owner') },
        ],
      },
      ...(relatedCounts.length > 0
        ? [
            {
              heading: '関連レコード件数',
              items: relatedCounts.map((r) => ({
                label: r.label,
                value: `${r.count}件`,
              })),
            },
          ]
        : []),
    ],
  };

  const result: ToolResult = {
    outputType: 'card',
    data: cardData,
  };

  return ok(result);
};

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '(不明)';
  try {
    return new Date(dateStr).toLocaleString('ja-JP');
  } catch {
    return dateStr;
  }
}

function getNestedName(record: SObjectRecord, field: string): string {
  const nested = record[field];
  if (nested && typeof nested === 'object' && 'Name' in (nested as Record<string, unknown>)) {
    return String((nested as Record<string, unknown>).Name);
  }
  return '(不明)';
}
