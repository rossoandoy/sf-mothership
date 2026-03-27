import { useEffect, useState } from 'react';
import { AVAILABLE_PACKS } from '@/types/pack';
import { getActivePack, setActivePack } from '@/packs/packLoader';
import type { ExecutionLogEntry } from '@/runtime/executionLogger';
import { getExecutionLogs } from '@/runtime/executionLogger';

export function Options() {
  const [currentPack, setCurrentPack] = useState('default');
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<ExecutionLogEntry[]>([]);

  useEffect(() => {
    getActivePack().then(setCurrentPack);
    getExecutionLogs().then(setLogs);
  }, []);

  const handlePackChange = async (packId: string) => {
    setSaving(true);
    await setActivePack(packId);
    setCurrentPack(packId);
    setSaving(false);
  };

  const handleClearCache = async () => {
    const keys = await chrome.storage.local.get(null);
    const cacheKeys = Object.keys(keys).filter(
      (k) => k.startsWith('describe_') || k.startsWith('orginfo_')
    );
    if (cacheKeys.length > 0) {
      await chrome.storage.local.remove(cacheKeys);
      alert(`${cacheKeys.length}件のキャッシュをクリアしました`);
    } else {
      alert('クリア対象のキャッシュはありません');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">SF Mothership 設定</h1>

      {/* Pack設定 */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Project Pack</h2>
        <p className="text-sm text-gray-500 mb-4">
          案件に応じたツール設定とUATガイドを切り替えます。
        </p>
        <div className="space-y-2">
          {AVAILABLE_PACKS.map((pack) => (
            <label
              key={pack.id}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                currentPack === pack.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="pack"
                value={pack.id}
                checked={currentPack === pack.id}
                onChange={() => handlePackChange(pack.id)}
                disabled={saving}
                className="mt-0.5"
              />
              <div>
                <span className="text-sm font-medium text-gray-800">{pack.name}</span>
                <p className="text-xs text-gray-500 mt-0.5">{pack.description}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* キャッシュ管理 */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">キャッシュ管理</h2>
        <p className="text-sm text-gray-500 mb-4">
          Describe APIのキャッシュをクリアします（通常は1時間で自動期限切れ）。
        </p>
        <button
          onClick={handleClearCache}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-200 transition-colors"
        >
          キャッシュをクリア
        </button>
      </section>

      {/* 実行ログ */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">実行ログ (直近{logs.length}件)</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-400">まだ実行ログはありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-2 py-1.5 text-left text-gray-600">日時</th>
                  <th className="px-2 py-1.5 text-left text-gray-600">ツール</th>
                  <th className="px-2 py-1.5 text-left text-gray-600">Org</th>
                  <th className="px-2 py-1.5 text-left text-gray-600">結果</th>
                  <th className="px-2 py-1.5 text-left text-gray-600">時間</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-2 py-1.5 text-gray-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-2 py-1.5 text-gray-800">{log.toolId}</td>
                    <td className="px-2 py-1.5 text-gray-600 truncate max-w-[120px]">
                      {log.orgDomain}
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={log.success ? 'text-green-600' : 'text-red-600'}>
                        {log.success ? '成功' : 'エラー'}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-gray-600">{log.durationMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
