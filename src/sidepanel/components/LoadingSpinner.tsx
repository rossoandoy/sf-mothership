interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = '読み込み中...' }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center gap-2 py-4 justify-center">
      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-gray-500">{message}</span>
    </div>
  );
}
