export function AuthError() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
        <span className="text-red-500 text-xl">!</span>
      </div>
      <h3 className="text-sm font-semibold text-gray-800 mb-1">認証が必要です</h3>
      <p className="text-xs text-gray-500 text-center mb-4">
        Salesforceにログインしていないか、セッションが期限切れです。
      </p>
      <p className="text-xs text-gray-400 text-center">
        ブラウザでSalesforceにログインしてから、このパネルを開き直してください。
      </p>
    </div>
  );
}
