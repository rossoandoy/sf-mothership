import { describe, it, expect, beforeEach } from 'vitest';
import { registerTool, getDrawerTools, clearRegistry } from './toolRegistry';
import type { ToolDefinition, ToolHandler } from '@/types/tool';
import type { PageContext } from '@/types/context';
import type { OrgInfo } from '@/types/salesforce';

const noopHandler: ToolHandler = async () => ({ ok: true, data: { outputType: 'card', data: { title: '', sections: [] } } });

function makeTool(overrides: Partial<ToolDefinition> & { id: string }): ToolDefinition {
  return {
    title: overrides.id,
    description: 'test',
    category: 'viewer',
    pageMatch: ['recordPage'],
    objectMatch: ['*'],
    inputs: [],
    dataSources: [],
    operations: [{ type: 'builtin', handler: 'test' }],
    output: { type: 'card' },
    safety: {
      level: 'readOnly',
      allowInProd: true,
      requireConfirm: false,
      maxAffectedRecords: 0,
      dryRunSupported: false,
    },
    projectTags: ['default'],
    enabled: true,
    ...overrides,
  };
}

const context: PageContext = {
  orgDomain: 'test.lightning.force.com',
  objectApiName: 'Account',
  recordId: '001xx000003DGbQAAW',
  pageType: 'recordPage',
  url: 'https://test.lightning.force.com/lightning/r/Account/001xx000003DGbQAAW/view',
  isSandboxDomain: true,
  timestamp: Date.now(),
};

const orgInfo: OrgInfo = {
  id: '00D',
  name: 'Test',
  isSandbox: true,
  organizationType: 'Developer Edition',
};

describe('getDrawerTools', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('タブ配線済みツールを除外する', () => {
    registerTool(makeTool({ id: 'quick-record-viewer' }), noopHandler);
    registerTool(makeTool({ id: 'test-data-creator', category: 'action', projectTags: ['advanced'] }), noopHandler);

    const drawer = getDrawerTools(context, orgInfo);
    expect(drawer.map((t) => t.id)).toEqual(['test-data-creator']);
  });

  it('AI provider 無効時は AI ツールを除外する', () => {
    registerTool(makeTool({ id: 'tool-definition-assistant', projectTags: ['ai'] }), noopHandler);
    registerTool(makeTool({ id: 'report-analyzer', projectTags: ['ai'] }), noopHandler);

    const withoutAi = getDrawerTools(context, orgInfo, { aiToolsEnabled: false });
    expect(withoutAi).toHaveLength(0);

    const withAi = getDrawerTools(context, orgInfo, { aiToolsEnabled: true });
    expect(withAi).toHaveLength(2);
  });
});
