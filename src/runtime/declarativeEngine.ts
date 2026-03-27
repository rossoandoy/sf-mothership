import type {
  ToolDefinition,
  ToolExecutionContext,
  ToolResult,
  Operation,
  CardData,
  TableData,
  GuidePanelData,
  CardMapping,
  TableMapping,
  GuidePanelMapping,
} from '@/types/tool';
import type { Result } from '@/shared/result';
import { ok, err } from '@/shared/result';
import {
  resolveTemplate,
  resolveSOQLTemplate,
  type TemplateScope,
} from './templateEngine';
import { callApi } from '@/sidepanel/hooks/useApi';
import { logger } from '@/shared/logger';

// --- メインエントリ ---

/**
 * 宣言的ツール定義を実行する
 *
 * 1. 各operationを順次実行し、stepResultsに蓄積
 * 2. output.mappingを使って結果をToolResultに変換
 */
export async function executeDeclarativeTool(
  definition: ToolDefinition,
  ctx: ToolExecutionContext
): Promise<Result<ToolResult>> {
  const scope: TemplateScope = {
    context: ctx.pageContext,
    inputs: ctx.inputs,
    steps: {},
  };

  // 各operationを順次実行
  for (const op of definition.operations) {
    if (op.type === 'builtin') {
      return err('宣言的ツール内にbuiltin操作を混在させることはできません');
    }

    const stepResult = await executeStep(op, ctx, scope);
    if (!stepResult.ok) return stepResult;

    scope.steps[op.stepId] = stepResult.data;
  }

  // 出力マッピング
  const mapping = definition.output.mapping;
  if (!mapping) {
    return err('宣言的ツールにはoutput.mappingが必要です');
  }

  return buildOutput(mapping, scope);
}

// --- ステップ実行 ---

async function executeStep(
  op: Exclude<Operation, { type: 'builtin' }>,
  ctx: ToolExecutionContext,
  scope: TemplateScope
): Promise<Result<unknown>> {
  switch (op.type) {
    case 'query':
      return executeQueryStep(op, scope);

    case 'describe':
      return executeDescribeStep(op, scope);

    case 'userInfo':
      return executeUserInfoStep(scope);

    case 'createRecord':
      return executeCreateRecordStep(op, ctx, scope);

    case 'staticData':
      return ok(op.data);

    case 'transform':
      return executeTransformStep(op, scope);

    case 'forEach':
      return executeForEachStep(op, scope);
  }
}

async function executeQueryStep(
  op: { stepId: string; soql: string },
  scope: TemplateScope
): Promise<Result<unknown>> {
  const soqlResult = resolveSOQLTemplate(op.soql, scope);
  if (!soqlResult.ok) return err(`SOQL展開エラー (${op.stepId}): ${soqlResult.error}`);

  logger.debug(`宣言的クエリ実行 [${op.stepId}]`, soqlResult.data);

  const result = await callApi('query', {
    domain: scope.context.orgDomain,
    soql: soqlResult.data,
  });

  if (!result.ok) return err(`クエリエラー (${op.stepId}): ${result.error}`);
  return ok(result.data);
}

async function executeDescribeStep(
  op: { stepId: string; objectApiName?: string },
  scope: TemplateScope
): Promise<Result<unknown>> {
  let objectApiName: string;

  if (op.objectApiName) {
    const resolved = resolveTemplate(op.objectApiName, scope);
    if (!resolved.ok) return err(`objectApiName展開エラー: ${resolved.error}`);
    objectApiName = resolved.data;
  } else {
    objectApiName = scope.context.objectApiName ?? '';
  }

  if (!objectApiName) {
    return err(`Describe対象オブジェクトが特定できません (${op.stepId})`);
  }

  const result = await callApi('describe', {
    domain: scope.context.orgDomain,
    objectApiName,
  });

  if (!result.ok) return err(`Describeエラー (${op.stepId}): ${result.error}`);
  return ok(result.data);
}

async function executeUserInfoStep(
  scope: TemplateScope
): Promise<Result<unknown>> {
  const result = await callApi('userInfo', {
    domain: scope.context.orgDomain,
  });

  if (!result.ok) return err(`ユーザー情報取得エラー: ${result.error}`);
  return ok(result.data);
}

async function executeCreateRecordStep(
  op: { stepId: string; objectApiName?: string; fields: Record<string, string> },
  ctx: ToolExecutionContext,
  scope: TemplateScope
): Promise<Result<unknown>> {
  let objectApiName: string;

  if (op.objectApiName) {
    const resolved = resolveTemplate(op.objectApiName, scope);
    if (!resolved.ok) return err(resolved.error);
    objectApiName = resolved.data;
  } else {
    objectApiName = scope.context.objectApiName ?? '';
  }

  if (!objectApiName) {
    return err('作成対象オブジェクトが特定できません');
  }

  // フィールド値を展開
  const resolvedFields: Record<string, unknown> = {};
  for (const [key, template] of Object.entries(op.fields)) {
    const resolved = resolveTemplate(template, scope);
    if (!resolved.ok) return err(`フィールド "${key}" の展開エラー: ${resolved.error}`);
    resolvedFields[key] = resolved.data;
  }

  // DryRun: プレビューのみ
  if (ctx.isDryRun) {
    return ok({
      dryRun: true,
      objectApiName,
      fields: resolvedFields,
    });
  }

  // 実際の作成
  const result = await callApi('createRecord', {
    domain: scope.context.orgDomain,
    objectApiName,
    data: resolvedFields,
  });

  if (!result.ok) return err(`レコード作成エラー: ${result.error}`);
  return ok(result.data);
}

async function executeTransformStep(
  op: { stepId: string; sourceStepId: string; sourcePath: string; filter?: string; limit?: number },
  scope: TemplateScope
): Promise<Result<unknown>> {
  const sourceData = scope.steps[op.sourceStepId];
  if (!sourceData) {
    return err(`ステップ "${op.sourceStepId}" の結果が見つかりません (${op.stepId})`);
  }

  const array = getNestedValue(sourceData, op.sourcePath);
  if (!Array.isArray(array)) {
    return err(`"${op.sourceStepId}.${op.sourcePath}" が配列ではありません (${op.stepId})`);
  }

  let result = array;

  // フィルタ
  if (op.filter) {
    result = result.filter((item) => {
      const itemScope: TemplateScope = { ...scope, row: item };
      const resolved = resolveTemplate(op.filter as string, itemScope);
      if (!resolved.ok) return false;
      const val = resolved.data;
      return val !== '' && val !== '0' && val !== 'false' && val !== 'undefined' && val !== 'null';
    });
  }

  // リミット
  if (op.limit && op.limit > 0) {
    result = result.slice(0, op.limit);
  }

  return ok(result);
}

async function executeForEachStep(
  op: { stepId: string; sourceStepId: string; sourcePath: string; filter?: string; limit?: number; soql: string },
  scope: TemplateScope
): Promise<Result<unknown>> {
  const sourceData = scope.steps[op.sourceStepId];
  if (!sourceData) {
    return err(`ステップ "${op.sourceStepId}" の結果が見つかりません (${op.stepId})`);
  }

  const array = getNestedValue(sourceData, op.sourcePath);
  if (!Array.isArray(array)) {
    return err(`"${op.sourceStepId}.${op.sourcePath}" が配列ではありません (${op.stepId})`);
  }

  let items = array;

  // フィルタ
  if (op.filter) {
    items = items.filter((item) => {
      const itemScope: TemplateScope = { ...scope, row: item };
      const resolved = resolveTemplate(op.filter as string, itemScope);
      if (!resolved.ok) return false;
      const val = resolved.data;
      return val !== '' && val !== '0' && val !== 'false' && val !== 'undefined' && val !== 'null';
    });
  }

  // リミット
  if (op.limit && op.limit > 0) {
    items = items.slice(0, op.limit);
  }

  // 各要素に対してSOQLを実行
  const results: Array<{ item: unknown; queryResult: unknown }> = [];
  for (const item of items) {
    const itemScope: TemplateScope = {
      ...scope,
      row: item, // {{row.*}} で各要素のプロパティを参照
    };
    const soqlResult = resolveSOQLTemplate(op.soql, itemScope);
    if (!soqlResult.ok) {
      logger.debug(`forEach SOQL展開スキップ`, soqlResult.error);
      continue;
    }

    const queryResult = await callApi('query', {
      domain: scope.context.orgDomain,
      soql: soqlResult.data,
    });

    if (queryResult.ok) {
      results.push({ item, queryResult: queryResult.data });
    }
  }

  return ok(results);
}

// --- 出力ビルダー ---

function buildOutput(
  mapping: CardMapping | TableMapping | GuidePanelMapping,
  scope: TemplateScope
): Result<ToolResult> {
  switch (mapping.type) {
    case 'card':
      return buildCardOutput(mapping, scope);
    case 'table':
      return buildTableOutput(mapping, scope);
    case 'guidePanel':
      return buildGuidePanelOutput(mapping, scope);
  }
}

function buildCardOutput(
  mapping: CardMapping,
  scope: TemplateScope
): Result<ToolResult> {
  // タイトル解決
  const titleResult = resolveTemplate(mapping.title, scope);
  if (!titleResult.ok) return err(`カードタイトル展開エラー: ${titleResult.error}`);

  const sections: CardData['sections'] = [];

  for (const sectionMapping of mapping.sections) {
    // 条件チェック
    if (sectionMapping.condition) {
      const condResult = resolveTemplate(sectionMapping.condition, scope);
      if (!condResult.ok || !condResult.data || condResult.data === '0' || condResult.data === 'false') {
        continue; // 条件不成立 → セクションをスキップ
      }
    }

    // heading解決
    const headingResult = resolveTemplate(sectionMapping.heading, scope);
    const heading = headingResult.ok ? headingResult.data : sectionMapping.heading;

    // items解決
    const items: CardData['sections'][number]['items'] = [];
    for (const itemMapping of sectionMapping.items) {
      const valueResult = resolveTemplate(itemMapping.value, scope);
      const value = valueResult.ok ? valueResult.data : '';

      let href: string | undefined;
      if (itemMapping.href) {
        const hrefResult = resolveTemplate(itemMapping.href, scope);
        href = hrefResult.ok ? hrefResult.data : undefined;
      }

      items.push({
        label: itemMapping.label,
        value,
        type: itemMapping.type,
        href,
      });
    }

    sections.push({ heading, items });
  }

  return ok({
    outputType: 'card',
    data: { title: titleResult.data, sections },
  });
}

function buildTableOutput(
  mapping: TableMapping,
  scope: TemplateScope
): Result<ToolResult> {
  // ステップ結果からrowsを取得
  const stepData = scope.steps[mapping.sourceStepId];
  if (!stepData) {
    return err(`ステップ "${mapping.sourceStepId}" の結果が見つかりません`);
  }

  // rowsPathでネストされた配列を取得
  const rowsArray = getNestedValue(stepData, mapping.rowsPath);
  if (!Array.isArray(rowsArray)) {
    return err(`"${mapping.sourceStepId}.${mapping.rowsPath}" が配列ではありません`);
  }

  // カラム定義
  const columns = mapping.columns.map((col) => ({
    key: col.key,
    label: col.label,
    sortable: col.sortable,
  }));

  // 行データ生成 — 各行に対してrow.*スコープでテンプレート解決
  const rows: Array<Record<string, string>> = [];
  for (const rowItem of rowsArray) {
    const rowScope: TemplateScope = { ...scope, row: rowItem };
    const row: Record<string, string> = {};

    for (const col of mapping.columns) {
      const valueResult = resolveTemplate(col.value, rowScope);
      row[col.key] = valueResult.ok ? valueResult.data : '';
    }

    rows.push(row);
  }

  const tableData: TableData = { columns, rows };
  return ok({ outputType: 'table', data: tableData });
}

function buildGuidePanelOutput(
  mapping: GuidePanelMapping,
  scope: TemplateScope
): Result<ToolResult> {
  // タイトル解決
  const titleResult = resolveTemplate(mapping.title, scope);
  const title = titleResult.ok ? titleResult.data : mapping.title;

  // ステップ結果からsectionsを取得
  const stepData = scope.steps[mapping.sourceStepId];
  if (!stepData) {
    return err(`ステップ "${mapping.sourceStepId}" の結果が見つかりません`);
  }

  const sectionsArray = getNestedValue(stepData, mapping.sectionsPath);
  if (!Array.isArray(sectionsArray)) {
    return err(`"${mapping.sourceStepId}.${mapping.sectionsPath}" が配列ではありません`);
  }

  // GuidePanelDataに変換
  const sections: GuidePanelData['sections'] = sectionsArray.map((section: unknown) => {
    const s = section as Record<string, unknown>;
    return {
      heading: String(s['heading'] ?? ''),
      items: Array.isArray(s['items']) ? (s['items'] as unknown[]).map(String) : [],
    };
  });

  return ok({
    outputType: 'guidePanel',
    data: { title, sections },
  });
}

// --- ヘルパー ---

function getNestedValue(obj: unknown, path: string): unknown {
  const segments = path.split('.');
  let current = obj;
  for (const segment of segments) {
    if (current == null) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}
