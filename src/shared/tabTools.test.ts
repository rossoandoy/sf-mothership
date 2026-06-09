import { describe, it, expect } from 'vitest';
import { getToolIdsForTab, TAB_TOOL_IDS } from './tabTools';

describe('getToolIdsForTab', () => {
  it('レコードページの今すぐタブ', () => {
    expect(getToolIdsForTab('instant', 'recordPage')).toEqual([
      'quick-record-viewer',
      'access-diagnostic',
    ]);
  });

  it('オブジェクトホームの今すぐタブ', () => {
    expect(getToolIdsForTab('instant', 'objectHome')).toEqual(['access-diagnostic']);
  });

  it('項目タブ', () => {
    expect(getToolIdsForTab('fields', 'recordPage')).toEqual(['field-context-inspector']);
  });

  it('setup では空', () => {
    expect(getToolIdsForTab('instant', 'setupPage')).toEqual([]);
  });
});

describe('TAB_TOOL_IDS', () => {
  it('4つのコアツールを含む', () => {
    expect(TAB_TOOL_IDS.size).toBe(4);
  });
});
