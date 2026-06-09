import type { ToolHandler, ToolResult, GuidePanelData } from '@/types/tool';
import type { DescribeResult } from '@/types/salesforce';
import { ok, err } from '@/shared/result';
import { callApi } from '@/sidepanel/hooks/useApi';
import { sendAppServerChat } from '@/api/appServerClient';
import { buildSafeContext, sanitizePayload } from '@/runtime/appServerSafety';

/**
 * 現在画面のオブジェクト情報から Pack JSON ツール定義ドラフトを生成する
 */
export const toolDefinitionAssistantHandler: ToolHandler = async (ctx) => {
  const { pageContext, orgInfo } = ctx;
  const { orgDomain, objectApiName } = pageContext;

  if (!objectApiName) {
    return err('オブジェクトが特定できません。レコード画面またはオブジェクトホームで実行してください。');
  }

  const describeResult = await callApi<DescribeResult>(
    'describe',
    { domain: orgDomain, objectApiName }
  );

  if (!describeResult.ok) return err(describeResult.error);

  const describe = describeResult.data;
  const fieldSummary = describe.fields.slice(0, 30).map((f) => ({
    name: f.name,
    label: f.label,
    type: f.type,
    updateable: f.updateable,
    createable: f.createable,
  }));

  const chatResult = await sendAppServerChat({
    task: 'tool-definition',
    prompt: [
      '以下のSalesforceオブジェクト情報をもとに、SF Mothership用の宣言的ツール定義JSONドラフトを生成してください。',
      'operations は query/describe のみ使用。output は table または card。',
      '日本語ラベルで。JSONのみ返答。',
    ].join('\n'),
    context: buildSafeContext(pageContext, orgInfo),
    data: sanitizePayload({
      objectApiName: describe.name,
      objectLabel: describe.label,
      fields: fieldSummary,
    }),
  });

  if (!chatResult.ok) return err(chatResult.error);

  const data: GuidePanelData = {
    title: `${describe.label} ツール定義ドラフト`,
    sections: [
      {
        heading: '生成結果（要確認・編集）',
        items: chatResult.data.content.split('\n').filter((line) => line.trim().length > 0),
      },
      {
        heading: '次のステップ',
        items: [
          '内容を確認し、Pack JSON (tools.json) に追加してください',
          'SOQL にユーザー入力を直接連結しないでください',
          'write 操作は sandbox のみ・confirm 必須にしてください',
        ],
      },
    ],
  };

  return ok({ outputType: 'guidePanel', data } as ToolResult);
};
