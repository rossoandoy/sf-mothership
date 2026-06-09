import { describe, it, expect, beforeEach } from 'vitest';
import { applyPackTools, getActivePackToolIds, resetPackRegistry } from './packRegistry';
import { getToolById, clearRegistry } from './toolRegistry';
import type { ToolDefinition } from '@/types/tool';

const sampleTool: ToolDefinition = {
  id: 'pack-test-tool',
  title: 'Pack Test',
  description: 'test',
  category: 'viewer',
  pageMatch: ['recordPage'],
  objectMatch: ['*'],
  inputs: [],
  dataSources: [],
  operations: [{ type: 'describe', stepId: 'desc' }],
  output: { type: 'table', mapping: { type: 'table', sourceStepId: 'desc', rowsPath: 'fields', columns: [] } },
  safety: {
    level: 'readOnly',
    allowInProd: true,
    requireConfirm: false,
    maxAffectedRecords: 0,
    dryRunSupported: false,
  },
  projectTags: ['test'],
  enabled: true,
};

describe('packRegistry', () => {
  beforeEach(() => {
    clearRegistry();
    resetPackRegistry();
  });

  it('Pack ツールを登録する', () => {
    applyPackTools([sampleTool]);
    expect(getActivePackToolIds()).toEqual(['pack-test-tool']);
    expect(getToolById('pack-test-tool')).toBeDefined();
  });

  it('Pack 切替時に前のツールを解除する', () => {
    applyPackTools([sampleTool]);

    const newTool: ToolDefinition = {
      ...sampleTool,
      id: 'pack-test-tool-2',
      title: 'Pack Test 2',
    };
    applyPackTools([newTool]);

    expect(getActivePackToolIds()).toEqual(['pack-test-tool-2']);
    expect(getToolById('pack-test-tool')).toBeUndefined();
    expect(getToolById('pack-test-tool-2')).toBeDefined();
  });
});
