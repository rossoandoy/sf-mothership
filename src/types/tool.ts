import type { PageType, PageContext } from './context';
import type { OrgInfo } from './salesforce';
import type { Result } from '@/shared/result';

// ツール定義 — JSON Pack定義にも使用される
export interface ToolDefinition {
  id: string;                           // kebab-case
  title: string;                        // 表示名
  description: string;                  // 説明文
  category: ToolCategory;
  pageMatch: PageType[];                // どの画面で表示するか
  objectMatch: string[];                // 対象オブジェクト（'*' = 全て）
  inputs: InputDefinition[];            // ユーザー入力定義
  dataSources: DataSource[];            // 利用するデータソース
  operations: Operation[];              // 実行内容
  output: OutputDefinition;             // 表示形式
  safety: SafetyDefinition;             // 安全制御
  projectTags: string[];                // 案件識別タグ
  enabled: boolean;                     // 有効/無効
}

export type ToolCategory = 'viewer' | 'diagnostic' | 'action' | 'guide';

export interface InputDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  required: boolean;
  defaultValue: string;
  helpText: string;
  options?: Array<{ label: string; value: string }>;
}

export type DataSource = 'currentRecord' | 'soql' | 'describe' | 'projectPackStatic';

// --- Operation 型 (discriminated union) ---

export type Operation =
  | BuiltinOperation
  | QueryOperation
  | DescribeOperation
  | UserInfoOperation
  | CreateRecordOperation
  | StaticDataOperation
  | TransformOperation
  | ForEachOperation;

/** 既存ビルトインハンドラへの参照（後方互換） */
export interface BuiltinOperation {
  type: 'builtin';
  handler: string;
}

/** SOQLクエリ（テンプレート変数付き） */
export interface QueryOperation {
  type: 'query';
  stepId: string;
  /** SOQL テンプレート。 {{context.objectApiName}}, {{context.recordId}}, {{inputs.*}}, {{steps.*}} が使用可能 */
  soql: string;
}

/** Describe API呼び出し */
export interface DescribeOperation {
  type: 'describe';
  stepId: string;
  /** 省略時は {{context.objectApiName}} */
  objectApiName?: string;
}

/** ユーザー情報取得 */
export interface UserInfoOperation {
  type: 'userInfo';
  stepId: string;
}

/** レコード作成（write操作） */
export interface CreateRecordOperation {
  type: 'createRecord';
  stepId: string;
  /** 省略時は {{context.objectApiName}} */
  objectApiName?: string;
  /** 項目マッピング。値はテンプレート式 */
  fields: Record<string, string>;
}

/** 静的データ（Pack JSONからのインラインデータ） */
export interface StaticDataOperation {
  type: 'staticData';
  stepId: string;
  data: unknown;
}

/** 前ステップの結果を変換する */
export interface TransformOperation {
  type: 'transform';
  stepId: string;
  /** 変換元ステップID */
  sourceStepId: string;
  /** 変換元データ内の配列パス（例: "fields", "records"） */
  sourcePath: string;
  /** フィルタ条件 — 各要素に対してテンプレート式を評価し、truthyなものだけ残す */
  filter?: string;
  /** 結果の最大件数 */
  limit?: number;
}

/** 配列の各要素に対してクエリを実行する（N+1パターン用） */
export interface ForEachOperation {
  type: 'forEach';
  stepId: string;
  /** イテレーション元ステップID */
  sourceStepId: string;
  /** イテレーション元データ内の配列パス */
  sourcePath: string;
  /** フィルタ条件（省略可） */
  filter?: string;
  /** 最大イテレーション数 */
  limit?: number;
  /** 各要素に対して実行するSOQLテンプレート。{{item.*}} で各要素のプロパティを参照 */
  soql: string;
}

// --- Output 型 ---

export interface OutputDefinition {
  type: 'card' | 'table' | 'guidePanel';
  /** 宣言的ツール用の出力マッピング。builtinツールでは省略 */
  mapping?: CardMapping | TableMapping | GuidePanelMapping;
}

/** SOQLクエリ結果 → カード表示へのマッピング */
export interface CardMapping {
  type: 'card';
  /** カードタイトル（テンプレート式） */
  title: string;
  sections: CardSectionMapping[];
}

export interface CardSectionMapping {
  heading: string;
  sourceStepId: string;
  items: CardItemMapping[];
  /** 条件式（テンプレート式、解決結果がtruthyならセクション表示） */
  condition?: string;
}

export interface CardItemMapping {
  label: string;
  /** 値テンプレート式 */
  value: string;
  type?: 'text' | 'link' | 'badge';
  /** リンク先テンプレート式 */
  href?: string;
}

/** Describe結果/クエリ結果 → テーブル表示へのマッピング */
export interface TableMapping {
  type: 'table';
  sourceStepId: string;
  /** ステップ結果内の行配列へのパス（例: "fields", "records"） */
  rowsPath: string;
  columns: TableColumnMapping[];
}

export interface TableColumnMapping {
  key: string;
  label: string;
  /** 各行の値テンプレート式（{{row.*}} スコープ） */
  value: string;
  sortable?: boolean;
}

/** 静的データ → ガイドパネル表示へのマッピング */
export interface GuidePanelMapping {
  type: 'guidePanel';
  title: string;
  sourceStepId: string;
  /** ステップ結果内のsections配列へのパス */
  sectionsPath: string;
}

export interface SafetyDefinition {
  level: 'readOnly' | 'lowRiskWrite' | 'highRiskWrite';
  allowInProd: boolean;
  requireConfirm: boolean;
  maxAffectedRecords: number;           // 0 = 制限なし
  dryRunSupported: boolean;
}

// ツール実行コンテキスト — ハンドラに渡される
export interface ToolExecutionContext {
  pageContext: PageContext;
  orgInfo: OrgInfo;
  inputs: Record<string, string>;
  isDryRun: boolean;
}

// ツール実行結果
export interface ToolResult {
  outputType: 'card' | 'table' | 'guidePanel';
  data: CardData | TableData | GuidePanelData;
}

// カード表示データ
export interface CardData {
  title: string;
  sections: Array<{
    heading: string;
    items: Array<{
      label: string;
      value: string;
      type?: 'text' | 'link' | 'badge';
      href?: string;
    }>;
  }>;
}

// テーブル表示データ
export interface TableData {
  columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
  }>;
  rows: Array<Record<string, string>>;
}

// ガイドパネル表示データ
export interface GuidePanelData {
  title: string;
  sections: Array<{
    heading: string;
    items: string[];
  }>;
}

// ツールハンドラ関数の型
export type ToolHandler = (
  ctx: ToolExecutionContext
) => Promise<Result<ToolResult>>;
