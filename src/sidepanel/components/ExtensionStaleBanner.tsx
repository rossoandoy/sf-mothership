export function ExtensionStaleBanner() {
  return (
    <div className="mx-4 mt-3 mb-1 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
      <p className="text-xs font-medium text-amber-800">拡張を更新しました</p>
      <p className="text-[10px] text-amber-700 mt-1">
        Salesforce タブを再読み込み（F5）してください。コンテキストが取得できません。
      </p>
    </div>
  );
}
