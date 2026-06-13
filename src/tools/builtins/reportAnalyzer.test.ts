import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DescribeResult, OrgInfo } from '@/types/salesforce';
import type { PageContext } from '@/types/context';
import type { GuidePanelData } from '@/types/tool';
import { generateAi } from '@/api/aiProvider';
import { callApi } from '@/sidepanel/hooks/useApi';
import { reportAnalyzerHandler } from './reportAnalyzer';
import { collectReportAnalyzerSnapshot, type ReportAnalyzerSnapshot } from './reportAnalyzerSnapshot';

vi.mock('@/api/aiProvider', () => ({
  generateAi: vi.fn(),
  getProviderDestinationLabel: vi.fn((providerId: string) =>
    providerId === 'chrome-prompt' ? 'オンデバイス処理' : 'localhost Local AI Provider'
  ),
}));

vi.mock('@/sidepanel/hooks/useApi', () => ({
  callApi: vi.fn(),
}));

vi.mock('./reportAnalyzerSnapshot', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./reportAnalyzerSnapshot')>();
  return {
    ...actual,
    collectReportAnalyzerSnapshot: vi.fn(),
  };
});

const mockedGenerateAi = vi.mocked(generateAi);
const mockedCallApi = vi.mocked(callApi);
const mockedCollectReportAnalyzerSnapshot = vi.mocked(collectReportAnalyzerSnapshot);

const pageContext: PageContext = {
  orgDomain: 'example.lightning.force.com',
  objectApiName: 'Account',
  recordId: null,
  pageType: 'objectHome',
  url: 'https://example.lightning.force.com/lightning/o/Account/list',
  isSandboxDomain: true,
  timestamp: 1,
};

const orgInfo: OrgInfo = {
  id: '00Dxx0000000001',
  name: 'Example Org',
  isSandbox: true,
  organizationType: 'Developer Edition',
};

const describeResult: DescribeResult = {
  name: 'Account',
  label: 'Account',
  labelPlural: 'Accounts',
  keyPrefix: '001',
  custom: false,
  createable: true,
  deletable: true,
  updateable: true,
  queryable: true,
  fields: [],
  childRelationships: [],
  recordTypeInfos: [],
};

const snapshot: ReportAnalyzerSnapshot = {
  objectApiName: 'Account',
  windowDays: 30,
  totalCount: 120,
  recentCount: 18,
  distributions: [
    {
      fieldName: 'Type',
      label: 'Type',
      type: 'picklist',
      buckets: [{ value: 'Customer', count: 80 }],
    },
  ],
  soql: [
    'SELECT COUNT() FROM Account',
    'SELECT COUNT() FROM Account WHERE CreatedDate = LAST_N_DAYS:30',
  ],
  warnings: ['Type 分布の一部取得に失敗しました'],
};

function buildContext(inputs: Record<string, string>) {
  return {
    pageContext,
    orgInfo,
    inputs,
    isDryRun: false,
  };
}

describe('reportAnalyzerHandler', () => {
  beforeEach(() => {
    mockedGenerateAi.mockReset();
    mockedCallApi.mockReset();
    mockedCollectReportAnalyzerSnapshot.mockReset();
    mockedCallApi.mockResolvedValue({ ok: true, data: describeResult });
    mockedCollectReportAnalyzerSnapshot.mockResolvedValue({ ok: true, data: snapshot });
    mockedGenerateAi.mockResolvedValue({
      ok: true,
      data: {
        content: '集計に基づく分析提案です',
        provider: 'local-http',
        model: 'mock-local-ai',
      },
    });
  });

  it('analysisGoal が空なら error を返す', async () => {
    const result = await reportAnalyzerHandler(buildContext({ analysisGoal: '' }));

    expect(result).toEqual({ ok: false, error: '分析目的を入力してください' });
    expect(mockedGenerateAi).not.toHaveBeenCalled();
  });

  it('unsafe objectFilter は Salesforce API を呼ばず error にする', async () => {
    const result = await reportAnalyzerHandler(buildContext({
      analysisGoal: '商談状況を確認したい',
      objectFilter: 'Account WHERE Name != null',
    }));

    expect(result.ok).toBe(false);
    expect(mockedCallApi).not.toHaveBeenCalled();
    expect(mockedCollectReportAnalyzerSnapshot).not.toHaveBeenCalled();
    expect(mockedGenerateAi).not.toHaveBeenCalled();
  });

  it('snapshot を AI payload に含める', async () => {
    await reportAnalyzerHandler(buildContext({
      analysisGoal: '顧客種別ごとの件数を見たい',
      windowDays: '30',
    }));

    expect(mockedCollectReportAnalyzerSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      objectApiName: 'Account',
      describe: describeResult,
      windowDays: 30,
    }));
    expect(mockedGenerateAi).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        analysisGoal: '顧客種別ごとの件数を見たい',
        objectFilter: 'Account',
        pageType: 'objectHome',
        snapshot,
      }),
    }));
  });

  it('AI 成功時に集計根拠と warnings を表示する', async () => {
    const result = await reportAnalyzerHandler(buildContext({
      analysisGoal: '顧客種別ごとの件数を見たい',
    }));

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.data.outputType).toBe('guidePanel');
    const guidePanel = result.data.data as GuidePanelData;
    const sections = guidePanel.sections;
    expect(sections.some((section) => section.heading === '集計スナップショット')).toBe(true);
    expect(sections.some((section) => section.heading === '実行した SOQL')).toBe(true);
    expect(sections.some((section) => section.heading === '集計 warnings')).toBe(true);
  });
});
