import type { PageContext } from '@/types/context';
import type { Result } from '@/shared/result';
import { ok, err } from '@/shared/result';
import { escapeSOQL, isValidRecordId } from '@/api/soqlClient';

// --- テンプレートスコープ ---

export interface TemplateScope {
  context: PageContext;
  inputs: Record<string, string>;
  steps: Record<string, unknown>;
  /** テーブル行イテレーション時の現在行 */
  row?: unknown;
}

// --- テンプレート解決 ---

const TEMPLATE_PATTERN = /\{\{(.+?)\}\}/g;

/**
 * テンプレート文字列内の {{...}} 式を解決する
 *
 * 例:
 *   "SELECT Id FROM {{context.objectApiName}}" → "SELECT Id FROM Account"
 *   "{{steps.q1.records.0.Name | default:(なし)}}" → "田中太郎"
 */
export function resolveTemplate(
  template: string,
  scope: TemplateScope
): Result<string> {
  let lastError: string | null = null;

  const resolved = template.replace(TEMPLATE_PATTERN, (_match, expr: string) => {
    const result = evaluateExpression(expr.trim(), scope);
    if (!result.ok) {
      lastError = result.error;
      return '';
    }
    return result.data;
  });

  if (lastError) {
    return err(lastError);
  }

  return ok(resolved);
}

/**
 * SOQL用テンプレート解決 — 変数にバリデーション/エスケープを適用
 */
export function resolveSOQLTemplate(
  template: string,
  scope: TemplateScope
): Result<string> {
  let lastError: string | null = null;

  const resolved = template.replace(TEMPLATE_PATTERN, (_match, expr: string) => {
    const trimmed = expr.trim();

    // パイプフィルタを分離
    const [pathPart] = trimmed.split('|').map(s => s.trim());
    if (!pathPart) {
      lastError = `無効なテンプレート式: ${trimmed}`;
      return '';
    }

    // context.recordId → ID形式バリデーション
    if (pathPart === 'context.recordId') {
      const value = scope.context.recordId ?? '';
      if (!isValidRecordId(value)) {
        lastError = `無効なレコードID: ${value}`;
        return '';
      }
      return value;
    }

    // context.objectApiName → API名形式バリデーション
    if (pathPart === 'context.objectApiName') {
      const value = scope.context.objectApiName ?? '';
      if (!isValidObjectApiName(value)) {
        lastError = `無効なオブジェクトAPI名: ${value}`;
        return '';
      }
      return value;
    }

    // inputs.* → SOQLエスケープ
    if (pathPart.startsWith('inputs.')) {
      const result = evaluateExpression(trimmed, scope);
      if (!result.ok) {
        lastError = result.error;
        return '';
      }
      return escapeSOQL(result.data);
    }

    // その他 → 通常解決
    const result = evaluateExpression(trimmed, scope);
    if (!result.ok) {
      lastError = result.error;
      return '';
    }
    return result.data;
  });

  if (lastError) {
    return err(lastError);
  }

  return ok(resolved);
}

// --- 式評価 ---

/**
 * 単一式を評価する（パスとパイプフィルタ）
 * 例: "steps.q1.records.0.Name | default:(なし) | formatDate"
 */
function evaluateExpression(
  expr: string,
  scope: TemplateScope
): Result<string> {
  const parts = expr.split('|').map(s => s.trim());
  const path = parts[0];
  const filters = parts.slice(1);

  if (!path) {
    return err(`空のテンプレート式`);
  }

  // パスを解決
  let value = resolvePath(path, scope);

  // パイプフィルタを適用
  for (const filter of filters) {
    value = applyFilter(value, filter);
  }

  return ok(formatValue(value));
}

// --- パス解決 ---

/**
 * ドットパスを辿ってスコープから値を取得する
 * 例: "steps.q1.records.0.Name" → scope.steps.q1.records[0].Name
 */
function resolvePath(path: string, scope: TemplateScope): unknown {
  const segments = path.split('.');

  let current: unknown;

  // 最初のセグメントでルートオブジェクトを決定
  const root = segments[0];
  switch (root) {
    case 'context':
      current = scope.context;
      break;
    case 'inputs':
      current = scope.inputs;
      break;
    case 'steps':
      current = scope.steps;
      break;
    case 'row':
      current = scope.row;
      // rowの場合は最初のセグメント自体がrowオブジェクトなので、
      // segments[1]から辿る
      return traverseFrom(current, segments.slice(1));
    default:
      return undefined;
  }

  // 残りのセグメントを辿る
  return traverseFrom(current, segments.slice(1));
}

function traverseFrom(obj: unknown, segments: string[]): unknown {
  let current = obj;
  for (const segment of segments) {
    if (current == null) return undefined;

    if (typeof current === 'object') {
      // 配列のインデックスアクセス
      if (Array.isArray(current)) {
        const index = parseInt(segment, 10);
        if (!isNaN(index)) {
          current = current[index];
          continue;
        }
      }
      // オブジェクトのプロパティアクセス
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

// --- パイプフィルタ ---

function applyFilter(value: unknown, filter: string): unknown {
  // "default:fallback" 形式の引数付きフィルタ
  const colonIndex = filter.indexOf(':');
  const filterName = colonIndex >= 0 ? filter.slice(0, colonIndex) : filter;
  const filterArg = colonIndex >= 0 ? filter.slice(colonIndex + 1) : undefined;

  switch (filterName) {
    case 'default':
      return value == null || value === '' || value === undefined
        ? (filterArg ?? '')
        : value;

    case 'formatDate':
      return formatDateValue(value);

    case 'yesNo':
      return value ? 'Yes' : '';

    case 'negate':
      return !value;

    case 'count':
      return Array.isArray(value) ? value.length : 0;

    case 'slice': {
      if (!Array.isArray(value) || !filterArg) return value;
      const [start, end] = filterArg.split(':').map(Number);
      return value.slice(start, end);
    }

    case 'truncate': {
      if (typeof value !== 'string') return value;
      const maxLen = parseInt(filterArg ?? '50', 10);
      return value.length > maxLen ? value.slice(0, maxLen) + '...' : value;
    }

    case 'join': {
      if (!Array.isArray(value)) return value;
      return value.join(filterArg ?? ', ');
    }

    case 'ifEmpty':
      return (value == null || value === '' || (Array.isArray(value) && value.length === 0))
        ? (filterArg ?? '')
        : value;

    case 'notNull':
      return value != null && value !== '' && value !== 'null';

    default:
      return value;
  }
}

// --- ヘルパー ---

function formatValue(value: unknown): string {
  if (value == null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `${value.length}件`;
  return String(value);
}

function formatDateValue(value: unknown): unknown {
  if (typeof value !== 'string' || !value) return value;
  try {
    return new Date(value).toLocaleString('ja-JP');
  } catch {
    return value;
  }
}

function isValidObjectApiName(name: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_]*(__c|__r|__mdt|__e|__b|__x)?$/.test(name);
}
