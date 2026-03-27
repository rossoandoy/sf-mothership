import type { ToolDefinition } from '@/types/tool';
import { registerTool } from '@/runtime/toolRegistry';
import { quickRecordViewerHandler } from './quickRecordViewer';
import { fieldContextInspectorHandler } from './fieldContextInspector';
import { accessDiagnosticHandler } from './accessDiagnostic';
import { testDataCreatorHandler } from './testDataCreator';
import { uatGuideHandler } from './uatGuide';

// ツール定義
const toolDefinitions: Array<{ definition: ToolDefinition; handler: typeof quickRecordViewerHandler }> = [
  {
    definition: {
      id: 'quick-record-viewer',
      title: 'クイックレコードビューア',
      description: '現在レコードの基本情報と関連リスト件数を表示',
      category: 'viewer',
      pageMatch: ['recordPage'],
      objectMatch: ['*'],
      inputs: [],
      dataSources: ['currentRecord', 'soql'],
      operations: [{ type: 'builtin', handler: 'quickRecordViewer' }],
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
    },
    handler: quickRecordViewerHandler,
  },
  {
    definition: {
      id: 'field-context-inspector',
      title: '項目コンテキスト調査',
      description: '現在オブジェクトの項目API名・型・属性一覧',
      category: 'viewer',
      pageMatch: ['recordPage', 'objectHome'],
      objectMatch: ['*'],
      inputs: [],
      dataSources: ['describe'],
      operations: [{ type: 'builtin', handler: 'fieldContextInspector' }],
      output: { type: 'table' },
      safety: {
        level: 'readOnly',
        allowInProd: true,
        requireConfirm: false,
        maxAffectedRecords: 0,
        dryRunSupported: false,
      },
      projectTags: ['default'],
      enabled: true,
    },
    handler: fieldContextInspectorHandler,
  },
  {
    definition: {
      id: 'access-diagnostic',
      title: 'アクセス診断',
      description: '権限・表示差異の原因候補を表示',
      category: 'diagnostic',
      pageMatch: ['recordPage', 'objectHome'],
      objectMatch: ['*'],
      inputs: [],
      dataSources: ['describe', 'currentRecord'],
      operations: [{ type: 'builtin', handler: 'accessDiagnostic' }],
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
    },
    handler: accessDiagnosticHandler,
  },
  {
    definition: {
      id: 'test-data-creator',
      title: 'テストデータ作成',
      description: 'Sandbox限定 — テスト用レコードを作成',
      category: 'action',
      pageMatch: ['recordPage', 'objectHome'],
      objectMatch: ['*'],
      inputs: [
        {
          id: 'recordName',
          label: 'レコード名',
          type: 'text',
          required: true,
          defaultValue: '',
          helpText: '作成するレコードのName項目',
        },
        {
          id: 'count',
          label: '作成件数',
          type: 'number',
          required: false,
          defaultValue: '1',
          helpText: '1〜5件まで',
        },
      ],
      dataSources: ['describe'],
      operations: [{ type: 'builtin', handler: 'testDataCreator' }],
      output: { type: 'card' },
      safety: {
        level: 'lowRiskWrite',
        allowInProd: false,
        requireConfirm: true,
        maxAffectedRecords: 5,
        dryRunSupported: true,
      },
      projectTags: ['default'],
      enabled: true,
    },
    handler: testDataCreatorHandler,
  },
  {
    definition: {
      id: 'uat-guide',
      title: 'UAT ガイド',
      description: '画面ごとの確認ポイント・ガイドを表示',
      category: 'guide',
      pageMatch: ['recordPage', 'objectHome'],
      objectMatch: ['*'],
      inputs: [],
      dataSources: ['projectPackStatic'],
      operations: [{ type: 'builtin', handler: 'uatGuide' }],
      output: { type: 'guidePanel' },
      safety: {
        level: 'readOnly',
        allowInProd: true,
        requireConfirm: false,
        maxAffectedRecords: 0,
        dryRunSupported: false,
      },
      projectTags: ['default'],
      enabled: true,
    },
    handler: uatGuideHandler,
  },
];

/**
 * ビルトインツール5本を登録する
 */
export function registerBuiltinTools(): void {
  for (const { definition, handler } of toolDefinitions) {
    registerTool(definition, handler);
  }
}
