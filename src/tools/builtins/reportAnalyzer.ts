import type { ToolHandler, ToolResult, GuidePanelData } from '@/types/tool';
import type { DescribeResult, SoqlResponse } from '@/types/salesforce';
import { ok, err } from '@/shared/result';
import { generateAi, getProviderDestinationLabel } from '@/api/aiProvider';
import { callApi } from '@/sidepanel/hooks/useApi';
import { buildSafeContext, sanitizePayload } from '@/runtime/appServerSafety';
import {
  buildSnapshotAiPayload,
  collectReportAnalyzerSnapshot,
  isSafeObjectApiName,
  type ReportAnalyzerSnapshot,
  type ReportSnapshotQueryFn,
} from './reportAnalyzerSnapshot';

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
  const windowDays = parseWindowDays(inputs['windowDays']);

  if (!objectFilter) {
    return err('対象オブジェクトを指定してください');
  }

  if (!isSafeObjectApiName(objectFilter)) {
    return err('対象オブジェクト API 名が安全な形式ではありません');
  }

  const describeResult = await callApi<DescribeResult>(
    'describe',
    { domain: pageContext.orgDomain, objectApiName: objectFilter }
  );
  if (!describeResult.ok) return err(describeResult.error);

  const query: ReportSnapshotQueryFn = (soql: string) =>
    callApi<SoqlResponse<Record<string, unknown>>>('query', { domain: pageContext.orgDomain, soql });

  const snapshotResult = await collectReportAnalyzerSnapshot({
    objectApiName: objectFilter,
    describe: describeResult.data,
    windowDays,
    query,
  });
  if (!snapshotResult.ok) return err(snapshotResult.error);

  const snapshotPayload = buildSnapshotAiPayload(snapshotResult.data);

  const chatResult = await generateAi({
    task: 'report-analyze',
    prompt: [
      'Salesforce導入現場のレポート/データ分析アシスタントとして、以下の目的に沿った分析計画とSOQL案を日本語で提示してください。',
      `分析目的: ${analysisGoal}`,
      objectFilter ? `対象オブジェクト: ${objectFilter}` : '',
      `集計期間: 直近${windowDays}日`,
      '以下の集計スナップショットを根拠にしてください。存在しない実データを断定しないでください。',
      '実行手順、注意点、想定される権限要件も含めてください。',
    ].filter(Boolean).join('\n'),
    context: buildSafeContext(pageContext, orgInfo),
    data: sanitizePayload({
      analysisGoal,
      objectFilter,
      pageType: pageContext.pageType,
      snapshot: snapshotPayload,
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
        heading: '集計スナップショット',
        items: formatSnapshotItems(snapshotResult.data),
      },
      {
        heading: '実行した SOQL',
        items: snapshotResult.data.soql,
      },
      ...(snapshotResult.data.warnings.length > 0
        ? [
          {
            heading: '集計 warnings',
            items: snapshotResult.data.warnings,
          },
        ]
        : []),
      {
        heading: '注意',
        items: [
          '本ツールは分析計画の提示です。実データの取得はSalesforce上で手動確認してください',
          'AI Provider に送るのは集計値とSOQLのみです。生レコードやセッション情報は送信しません',
        ],
      },
    ],
  };

  return ok({ outputType: 'guidePanel', data } as ToolResult);
};

function parseWindowDays(value: string | undefined): 7 | 30 | 90 {
  if (value === '7') return 7;
  if (value === '90') return 90;
  return 30;
}

function formatSnapshotItems(snapshot: ReportAnalyzerSnapshot): string[] {
  const items = [
    `対象オブジェクト: ${snapshot.objectApiName}`,
    `総件数: ${snapshot.totalCount ?? '(取得不可)'}`,
    `直近${snapshot.windowDays}日: ${snapshot.recentCount ?? '(取得不可)'}`,
  ];

  for (const distribution of snapshot.distributions) {
    const buckets = distribution.buckets
      .map((bucket) => `${bucket.value}: ${bucket.count}件`)
      .join(' / ');
    items.push(`${distribution.label} (${distribution.fieldName}): ${buckets || '(データなし)'}`);
  }

  return items;
}
