import type { ToolHandler, ToolResult, GuidePanelData } from '@/types/tool';
import type { DescribeResult } from '@/types/salesforce';
import { ok, err } from '@/shared/result';
import { callApi } from '@/sidepanel/hooks/useApi';
import { generateAi, getProviderDestinationLabel } from '@/api/aiProvider';
import { buildSafeContext, sanitizePayload } from '@/runtime/appServerSafety';
import type { SoqlResponse } from '@/types/salesforce';
import { escapeSOQL } from '@/api/soqlClient';

interface ChatterUserResponse {
  id: string;
  name: string;
}

interface UserProfileRow {
  Id: string;
  Name: string;
  Profile: { Name: string };
}

/**
 * Access Diagnostic の結果を自然言語で説明する AI 補助ツール
 */
export const accessDiagnosticExplainerHandler: ToolHandler = async (ctx) => {
  const { pageContext, orgInfo } = ctx;
  const { orgDomain, objectApiName } = pageContext;

  if (!objectApiName) {
    return err('オブジェクトが特定できません');
  }

  const describeResult = await callApi<DescribeResult>(
    'describe',
    { domain: orgDomain, objectApiName }
  );

  if (!describeResult.ok) return err(describeResult.error);

  const describe = describeResult.data;

  const chatterUser = await callApi<ChatterUserResponse>('userInfo', { domain: orgDomain });

  let profileName = '不明';
  if (chatterUser.ok) {
    const profileSoql = `SELECT Id, Name, Profile.Name FROM User WHERE Id = '${escapeSOQL(chatterUser.data.id)}' LIMIT 1`;
    const profileResult = await callApi<SoqlResponse<UserProfileRow>>('query', {
      domain: orgDomain,
      soql: profileSoql,
    });
    if (profileResult.ok && profileResult.data.records[0]) {
      profileName = profileResult.data.records[0].Profile.Name;
    }
  }

  const nonUpdateableFields = describe.fields
    .filter((f) => !f.updateable)
    .slice(0, 25)
    .map((f) => ({
      name: f.name,
      label: f.label,
      type: f.type,
      calculated: !!f.calculatedFormula,
    }));

  const diagnosticSummary = {
    objectLabel: describe.label,
    objectPermissions: {
      queryable: describe.queryable,
      createable: describe.createable,
      updateable: describe.updateable,
      deletable: describe.deletable,
    },
    profileName,
    nonUpdateableFieldCount: describe.fields.filter((f) => !f.updateable).length,
    nonUpdateableFieldsSample: nonUpdateableFields,
  };

  const chatResult = await generateAi({
    task: 'diagnostic-explain',
    prompt: [
      '以下のSalesforceアクセス診断サマリを、導入担当者向けに日本語で簡潔に説明してください。',
      '原因候補と確認手順を箇条書きで。技術用語は適度に。',
    ].join('\n'),
    context: buildSafeContext(pageContext, orgInfo),
    data: sanitizePayload(diagnosticSummary),
    locale: 'ja-JP',
    privacy: 'localServerAllowed',
  });

  if (!chatResult.ok) return err(chatResult.error);

  const data: GuidePanelData = {
    title: `${describe.label} アクセス診断 — AI説明`,
    sections: [
      {
        heading: '診断サマリ',
        items: [
          `Profile: ${diagnosticSummary.profileName}`,
          `編集不可項目: ${diagnosticSummary.nonUpdateableFieldCount}件`,
          `オブジェクト編集権限: ${describe.updateable ? 'あり' : 'なし'}`,
        ],
      },
      {
        heading: 'AI による説明',
        items: chatResult.data.content.split('\n').filter((line) => line.trim().length > 0),
      },
      {
        heading: 'AI provider',
        items: [
          `Provider: ${chatResult.data.provider}${chatResult.data.model ? ` (${chatResult.data.model})` : ''}`,
          `処理先: ${getProviderDestinationLabel(chatResult.data.provider)}`,
        ],
      },
    ],
  };

  return ok({ outputType: 'guidePanel', data } as ToolResult);
};
