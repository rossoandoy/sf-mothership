import type { ToolHandler, ToolResult, CardData } from '@/types/tool';
import type { DescribeResult, SoqlResponse } from '@/types/salesforce';
import { ok, err } from '@/shared/result';
import { callApi } from '@/sidepanel/hooks/useApi';
import { escapeSOQL } from '@/api/soqlClient';

interface ChatterUserResponse {
  id: string;
  name: string;
  email: string;
  title: string | null;
}

interface UserProfileRow {
  Id: string;
  Name: string;
  Profile: { Name: string };
}

export const accessDiagnosticHandler: ToolHandler = async (ctx) => {
  const { pageContext } = ctx;
  const { orgDomain, objectApiName } = pageContext;

  if (!objectApiName) {
    return err('オブジェクトが特定できません');
  }

  const userResult = await callApi<ChatterUserResponse>(
    'userInfo',
    { domain: orgDomain }
  );

  const describeResult = await callApi<DescribeResult>(
    'describe',
    { domain: orgDomain, objectApiName }
  );

  if (!describeResult.ok) return err(describeResult.error);

  const describe = describeResult.data;

  // Profile 名を SOQL で取得
  let profileName = '(取得不可)';
  let userId = '(取得不可)';
  let userName = '(取得不可)';

  if (userResult.ok) {
    userId = userResult.data.id;
    userName = userResult.data.name;

    const profileSoql = `SELECT Id, Name, Profile.Name FROM User WHERE Id = '${escapeSOQL(userResult.data.id)}' LIMIT 1`;
    const profileResult = await callApi<SoqlResponse<UserProfileRow>>(
      'query',
      { domain: orgDomain, soql: profileSoql }
    );

    if (profileResult.ok && profileResult.data.records[0]) {
      profileName = profileResult.data.records[0].Profile.Name;
    }
  }

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

  sections.push({
    heading: 'ユーザー情報',
    items: [
      { label: 'User Id', value: userId },
      { label: 'ユーザー名', value: userName },
      { label: 'Profile', value: profileName },
      ...(userResult.ok ? [
        { label: 'メール', value: userResult.data.email },
        ...(userResult.data.title ? [{ label: '役職', value: userResult.data.title }] : []),
      ] : []),
    ],
  });

  sections.push({
    heading: `${describe.label} のオブジェクト権限`,
    items: [
      { label: '参照', value: describe.queryable ? 'Yes' : 'No' },
      { label: '作成', value: describe.createable ? 'Yes' : 'No' },
      { label: '編集', value: describe.updateable ? 'Yes' : 'No' },
      { label: '削除', value: describe.deletable ? 'Yes' : 'No' },
    ],
  });

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

  return ok({
    outputType: 'card',
    data: cardData,
  } as ToolResult);
};
