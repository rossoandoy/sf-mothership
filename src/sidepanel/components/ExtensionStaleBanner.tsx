import type { ExtensionStatus } from '../hooks/useExtensionStale';

interface ExtensionStaleBannerProps {
  status: Exclude<ExtensionStatus, 'ready' | 'checking'>;
  onRetry: () => void;
}

const COPY: Record<ExtensionStaleBannerProps['status'], {
  title: string;
  body: string;
  showRetry: boolean;
}> = {
  waitingForContext: {
    title: 'Salesforce ページを確認中です',
    body: 'Salesforce のレコード画面またはオブジェクト画面を開いてください。表示中の場合は再取得できます。',
    showRetry: true,
  },
  staleContentScript: {
    title: '拡張を更新しました',
    body: 'Salesforce タブを再読み込み（F5）してください。古い Content Script からは文脈を取得できません。',
    showRetry: false,
  },
  serviceWorkerError: {
    title: 'Service Worker から応答がありません',
    body: '一時的な起動待ちの可能性があります。再取得しても戻らない場合は Salesforce タブを再読み込みしてください。',
    showRetry: true,
  },
};

export function ExtensionStaleBanner({ status, onRetry }: ExtensionStaleBannerProps) {
  const copy = COPY[status];

  return (
    <div className="mx-4 mt-3 mb-1 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-amber-800">{copy.title}</p>
          <p className="text-[10px] text-amber-700 mt-1">{copy.body}</p>
        </div>
        {copy.showRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 text-[10px] font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded px-2 py-1"
          >
            再取得
          </button>
        )}
      </div>
    </div>
  );
}
