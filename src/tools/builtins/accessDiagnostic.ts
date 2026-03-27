import type { ToolHandler, ToolResult, CardData } from '@/types/tool';
import type { DescribeResult } from '@/types/salesforce';
import { ok, err } from '@/shared/result';
import { callApi } from '@/sidepanel/hooks/useApi';

interface ChatterUserResponse {
  id: string;
  name: string;
  email: string;
  title: string | null;
}

export const accessDiagnosticHandler: ToolHandler = async (ctx) => {
  const { pageContext } = ctx;
  const { orgDomain, objectApiName } = pageContext;

  if (!objectApiName) {
    return err('オブジェクトが特定できません');
  }

  // 現在のユーザー情報
  const userResult = await callApi<ChatterUserResponse>(
    'userInfo',
    { domain: orgDomain }
  );

  // Describe情報でFLSを確認
  const describeResult = await callApi<DescribeResult>(
    'describe',
    { domain: orgDomain, objectApiName }
  );

  if (!describeResult.ok) return err(describeResult.error);

  const describe = describeResult.data;

  // 編集不可の項目を分析
  const updateIssues: Array<{ label: string; value: string }> = [];

  for (const field of describe.fields) {
    if (!field.updateable) {
      let reason = '編集不可';
      if (field.calculatedFormula) {
        reason = '数式項目';
      } else if (field.autoNumber) {
        reason = '自動採番';
      } else if (field.type === 'id') {
        reason = 'ID項目';
      } else if (
        ['CreatedDate', 'LastModifiedDate', 'CreatedById', 'LastModifiedById', 'SystemModstamp'].includes(field.name)
      ) {
        reason = 'システム項目';
      } else if (!field.createable) {
        reason = 'FLS制限（編集・作成とも不可）';
      } else {
        reason = 'FLS制限（編集不可）';
      }

      updateIssues.push({
        label: `${field.label} (${field.name})`,
        value: reason,
      });
    }
  }

  const sections: CardData['sections'] = [];

  // ユーザー情報
  if (userResult.ok) {
    sections.push({
      heading: 'ユーザー情報',
      items: [
        { label: 'ユーザー名', value: userResult.data.name },
        { label: 'メール', value: userResult.data.email },
        ...(userResult.data.title ? [{ label: '役職', value: userResult.data.title }] : []),
      ],
    });
  }

  // オブジェクト権限
  sections.push({
    heading: `${describe.label} のオブジェクト権限`,
    items: [
      { label: '参照', value: describe.queryable ? 'Yes' : 'No' },
      { label: '作成', value: describe.createable ? 'Yes' : 'No' },
      { label: '編集', value: describe.updateable ? 'Yes' : 'No' },
      { label: '削除', value: describe.deletable ? 'Yes' : 'No' },
    ],
  });

  // 編集不可項目（上位20件に制限）
  if (updateIssues.length > 0) {
    sections.push({
      heading: `編集不可項目 (${updateIssues.length}件)`,
      items: updateIssues.slice(0, 20),
    });
  }

  const cardData: CardData = {
    title: `${describe.label} のアクセス診断`,
    sections,
  };

  const result: ToolResult = {
    outputType: 'card',
    data: cardData,
  };

  return ok(result);
};
