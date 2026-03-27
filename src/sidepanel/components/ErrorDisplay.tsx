interface ErrorDisplayProps {
  error: string;
  onDismiss?: () => void;
}

export function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  const isAuthError = error.includes('認証') || error.includes('ログイン') || error.includes('セッション');
  const isPermissionError = error.includes('権限');

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <span className="text-red-500 text-sm shrink-0">!</span>
        <div className="flex-1">
          <p className="text-xs font-medium text-red-800">
            {isAuthError ? '認証エラー' : isPermissionError ? '権限エラー' : 'エラー'}
          </p>
          <p className="text-xs text-red-600 mt-1">{error}</p>
          {isAuthError && (
            <p className="text-[10px] text-red-500 mt-2">
              Salesforceに再ログインしてから、もう一度お試しください。
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 text-xs"
          >
            x
          </button>
        )}
      </div>
    </div>
  );
}
