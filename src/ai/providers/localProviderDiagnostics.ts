import type { Result } from '@/shared/result';
import type { AppServerHealthResponse } from '@/types/appServer';

export type LocalProviderHealthErrorKind =
  | 'wrongUrl'
  | 'serverStopped'
  | 'cors'
  | 'httpError'
  | 'disabled'
  | 'unknown';

export type LocalProviderHealthDescription =
  | { ok: true; message: string }
  | {
      ok: false;
      kind: LocalProviderHealthErrorKind;
      message: string;
      detail: string;
    };

function classifyLocalProviderError(error: string): LocalProviderHealthErrorKind {
  const lower = error.toLowerCase();
  if (lower.includes('無効')) return 'disabled';
  if (lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('url')) return 'wrongUrl';
  if (lower.includes('cors') || lower.includes('cross-origin')) return 'cors';
  if (lower.includes('http')) return 'httpError';
  if (
    lower.includes('failed to fetch') ||
    lower.includes('load failed') ||
    lower.includes('connection') ||
    lower.includes('接続できません') ||
    lower.includes('abort')
  ) {
    return 'serverStopped';
  }
  return 'unknown';
}

function messageFor(kind: LocalProviderHealthErrorKind): string {
  switch (kind) {
    case 'disabled':
      return 'Local AI Provider が無効です。Options で連携を有効化してください。';
    case 'wrongUrl':
      return 'Base URL は localhost または 127.0.0.1 のみ使えます。例: http://127.0.0.1:3847';
    case 'cors':
      return 'CORS 設定で Chrome 拡張からの接続が拒否されています。Local AI Provider 側で extension origin を許可してください。';
    case 'httpError':
      return 'Local AI Provider は応答しましたが、/health がエラーを返しました。API仕様とパスを確認してください。';
    case 'serverStopped':
      return 'Local AI Provider が起動していないか、指定ポートで待ち受けていません。サーバー起動と Base URL を確認してください。';
    case 'unknown':
      return 'Local AI Provider の接続確認に失敗しました。Base URL、サーバー起動状態、ブラウザコンソールを確認してください。';
  }
}

export function describeLocalProviderHealthResult(
  result: Result<AppServerHealthResponse>
): LocalProviderHealthDescription {
  if (result.ok) {
    return { ok: true, message: `接続OK (${result.data.status})` };
  }

  const kind = classifyLocalProviderError(result.error);
  return {
    ok: false,
    kind,
    message: messageFor(kind),
    detail: result.error,
  };
}
