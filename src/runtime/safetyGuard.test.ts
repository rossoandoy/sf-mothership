import { describe, it, expect } from 'vitest';
import { checkSafety } from './safetyGuard';
import type { ToolDefinition } from '@/types/tool';
import type { OrgInfo } from '@/types/salesforce';

const baseTool: ToolDefinition = {
  id: 'test-tool',
  title: 'Test',
  description: 'test',
  category: 'viewer',
  pageMatch: ['recordPage'],
  objectMatch: ['*'],
  inputs: [],
  dataSources: [],
  operations: [{ type: 'builtin', handler: 'test' }],
  output: { type: 'card' },
  safety: {
    level: 'lowRiskWrite',
    allowInProd: false,
    requireConfirm: true,
    maxAffectedRecords: 5,
    dryRunSupported: true,
  },
  projectTags: [],
  enabled: true,
};

const prodOrg: OrgInfo = {
  id: '00D',
  name: 'Prod',
  isSandbox: false,
  organizationType: 'Enterprise Edition',
};

const sandboxOrg: OrgInfo = {
  ...prodOrg,
  isSandbox: true,
};

describe('checkSafety', () => {
  it('production で allowInProd=false を拒否する', () => {
    const result = checkSafety(baseTool, prodOrg);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.canExecute).toBe(false);
      expect(result.data.reason).toContain('Production');
    }
  });

  it('sandbox では実行可能', () => {
    const result = checkSafety(baseTool, sandboxOrg);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.canExecute).toBe(true);
      expect(result.data.requiresConfirm).toBe(true);
      expect(result.data.supportsDryRun).toBe(true);
    }
  });

  it('maxAffectedRecords 超過を拒否する', () => {
    const result = checkSafety(baseTool, sandboxOrg, 10);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.canExecute).toBe(false);
    }
  });
});
