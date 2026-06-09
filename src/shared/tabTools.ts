/** タブに直接配線されるツール ID（ドロワーには出さない） */
export const TAB_TOOL_IDS = new Set([
  'quick-record-viewer',
  'field-context-inspector',
  'uat-guide',
  'access-diagnostic',
]);

export type ContextTabId = 'instant' | 'fields' | 'guide';

/** タブごとに自動実行するツール ID（pageType で追加フィルタ） */
export function getToolIdsForTab(tabId: ContextTabId, pageType: string): string[] {
  switch (tabId) {
    case 'instant':
      if (pageType === 'recordPage') {
        return ['quick-record-viewer', 'access-diagnostic'];
      }
      if (pageType === 'objectHome') {
        return ['access-diagnostic'];
      }
      return [];
    case 'fields':
      if (pageType === 'recordPage' || pageType === 'objectHome') {
        return ['field-context-inspector'];
      }
      return [];
    case 'guide':
      if (pageType === 'recordPage' || pageType === 'objectHome') {
        return ['uat-guide'];
      }
      return [];
    default:
      return [];
  }
}
