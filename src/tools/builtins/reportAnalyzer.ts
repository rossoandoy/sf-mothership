import type { ToolHandler, ToolResult, GuidePanelData } from '@/types/tool';
import { ok, err } from '@/shared/result';
import { generateAi, getProviderDestinationLabel } from '@/api/aiProvider';
import { buildSafeContext, sanitizePayload } from '@/runtime/appServerSafety';

/**
 * report-assistant 型のレポート/集計分析ツール
 * 長時間処理はローカル AI Provider に委譲
 */
export const reportAnalyzerHandler: ToolHandler = async (ctx) => {
  const { pageContext, orgInfo, inputs } = ctx;

  const analysisGoal = inputs['analysisGoal']?.trim();
  if (!analysisGoal) {
    return err('分析目的を入力してください');
  }

  const objectFilter = inputs['objectFilter']?.trim() || pageContext.objectApiName || '';

  const chatResult = await generateAi({
    task: 'report-analyze',
    prompt: [
      'Salesforce導入現場のレポート/データ分析アシスタントとして、以下の目的に沿った分析計画とSOQL案を日本語で提示してください。',
      `分析目的: ${analysisGoal}`,
      objectFilter ? `対象オブジェクト: ${objectFilter}` : '',
      '実行手順、注意点、想定される権限要件も含めてください。',
    ].filter(Boolean).join('\n'),
    context: buildSafeContext(pageContext, orgInfo),
    data: sanitizePayload({
      analysisGoal,
      objectFilter: objectFilter || null,
      pageType: pageContext.pageType,
    }),
    locale: 'ja-JP',
    privacy: 'localServerAllowed',
  });

  if (!chatResult.ok) return err(chatResult.error);

  const data: GuidePanelData = {
    title: 'レポート分析アシスタント',
    sections: [
      {
        heading: '分析目的',
        items: [analysisGoal],
      },
      {
        heading: '分析結果 / 提案',
        items: chatResult.data.content.split('\n').filter((line) => line.trim().length > 0),
      },
      {
        heading: 'AI provider',
        items: [
          `Provider: ${chatResult.data.provider}${chatResult.data.model ? ` (${chatResult.data.model})` : ''}`,
          `処理先: ${getProviderDestinationLabel(chatResult.data.provider)}`,
        ],
      },
      {
        heading: '注意',
        items: [
          '本ツールは分析計画の提示です。実データの取得はSalesforce上で手動確認してください',
          '大量データの集計は Local AI Provider 側で実行する想定です（将来拡張）',
        ],
      },
    ],
  };

  return ok({ outputType: 'guidePanel', data } as ToolResult);
};
