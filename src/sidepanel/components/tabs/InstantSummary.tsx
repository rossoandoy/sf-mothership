import { useState } from 'react';
import type { CardData } from '@/types/tool';
import type { TabPanelResult } from '../../hooks/useTabPanel';
import { CardOutput } from '../outputs/CardOutput';

interface InstantSummaryProps {
  results: TabPanelResult[];
}

function findItem(card: CardData | undefined, sectionHeading: string, label: string): string | null {
  if (!card) return null;
  const section = card.sections.find((s) => s.heading.includes(sectionHeading) || sectionHeading === '');
  if (!section) {
    for (const s of card.sections) {
      const item = s.items.find((i) => i.label === label || i.label.startsWith(label));
      if (item) return item.value;
    }
    return null;
  }
  const item = section.items.find((i) => i.label === label || i.label.startsWith(label));
  return item?.value ?? null;
}

function extractNonUpdateableCount(accessCard: CardData | undefined): string | null {
  if (!accessCard) return null;
  const section = accessCard.sections.find((s) => s.heading.includes('編集不可'));
  if (!section) return null;
  const match = section.heading.match(/\((\d+)件\)/);
  return match?.[1] ?? String(section.items.length);
}

export function InstantSummary({ results }: InstantSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  const recordCard = results.find((r) => r.toolId === 'quick-record-viewer')?.result;
  const accessCard = results.find((r) => r.toolId === 'access-diagnostic')?.result;

  const recordData = recordCard?.outputType === 'card' ? (recordCard.data as CardData) : undefined;
  const accessData = accessCard?.outputType === 'card' ? (accessCard.data as CardData) : undefined;

  const title = recordData?.title ?? accessData?.title ?? '概要';
  const profile = findItem(accessData, 'ユーザー情報', 'Profile');
  const userName = findItem(accessData, 'ユーザー情報', 'ユーザー名');
  const recordName = findItem(recordData, '基本情報', 'Name');
  const objectLabel = accessData?.title?.replace(/ のアクセス診断$/, '') ?? null;
  const nonUpdateable = extractNonUpdateableCount(accessData);
  const objectPerms = accessData?.sections.find((s) => s.heading.includes('オブジェクト権限'));

  const summaryItems: Array<{ label: string; value: string }> = [];

  if (recordName) summaryItems.push({ label: 'Name', value: recordName });
  if (userName) summaryItems.push({ label: 'ユーザー', value: userName });
  if (profile) summaryItems.push({ label: 'Profile', value: profile });
  if (objectLabel) summaryItems.push({ label: 'オブジェクト', value: objectLabel });
  if (objectPerms) {
    const edit = objectPerms.items.find((i) => i.label === '編集');
    if (edit) summaryItems.push({ label: 'オブジェクト編集', value: edit.value });
  }
  if (nonUpdateable) summaryItems.push({ label: '編集不可項目', value: `${nonUpdateable}件` });

  const relatedSection = recordData?.sections.find((s) => s.heading.includes('関連'));
  if (relatedSection && relatedSection.items.length > 0) {
    const topRelated = relatedSection.items.slice(0, 3);
    for (const item of topRelated) {
      summaryItems.push({ label: item.label, value: item.value });
    }
  }

  if (summaryItems.length === 0 && recordData) {
    const basic = recordData.sections.find((s) => s.heading === '基本情報');
    if (basic) {
      for (const item of basic.items.slice(0, 4)) {
        summaryItems.push({ label: item.label, value: item.value });
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 truncate">{title}</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {summaryItems.map((item, i) => (
            <div key={i} className="px-3 py-1.5 flex items-start gap-2">
              <span className="text-xs text-gray-500 w-24 shrink-0">{item.label}</span>
              <span className="text-xs text-gray-800 break-all">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-600 hover:text-blue-800"
      >
        {expanded ? '詳細を閉じる' : '詳細を見る'}
      </button>

      {expanded && (
        <div className="space-y-4 pt-1">
          {results.map(({ toolId, result }) => {
            if (result.outputType !== 'card') return null;
            return (
              <CardOutput key={toolId} data={result.data as CardData} />
            );
          })}
        </div>
      )}
    </div>
  );
}
