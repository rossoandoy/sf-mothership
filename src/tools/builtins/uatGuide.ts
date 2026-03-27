import type { ToolHandler, ToolResult, GuidePanelData } from '@/types/tool';
import { ok } from '@/shared/result';

// ガイド定義の型（Pack JSONから読み込む）
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

// MVPではビルトインのガイドデータを使用（Phase 6でPack JSONから読み込み）
let guides: GuideEntry[] = [];

export function setGuides(data: GuideEntry[]): void {
  guides = data;
}

export function getGuides(): GuideEntry[] {
  return guides;
}

export const uatGuideHandler: ToolHandler = async (ctx) => {
  const { pageContext } = ctx;
  const { objectApiName, pageType } = pageContext;

  // ガイドをフィルタ
  const matchedGuides = guides.filter((guide) => {
    // pageMatchフィルタ
    if (!guide.pageMatch.includes(pageType)) return false;

    // objectMatchフィルタ
    if (
      objectApiName &&
      !guide.objectMatch.includes('*') &&
      !guide.objectMatch.includes(objectApiName)
    ) {
      return false;
    }

    return true;
  });

  if (matchedGuides.length === 0) {
    const data: GuidePanelData = {
      title: 'ガイドなし',
      sections: [
        {
          heading: '',
          items: ['この画面に対応するUATガイドは登録されていません。'],
        },
      ],
    };

    return ok({ outputType: 'guidePanel', data } as ToolResult);
  }

  // 複数マッチした場合は全て結合
  const allSections = matchedGuides.flatMap((g) => g.sections);

  const data: GuidePanelData = {
    title: matchedGuides.length === 1
      ? (matchedGuides[0]?.title ?? 'UAT ガイド')
      : `UAT ガイド (${matchedGuides.length}件マッチ)`,
    sections: allSections,
  };

  return ok({ outputType: 'guidePanel', data } as ToolResult);
};
