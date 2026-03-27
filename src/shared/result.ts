// Result型パターン — 全APIとツール実行で統一的に使用

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<T>(error: string): Result<T> {
  return { ok: false, error };
}
