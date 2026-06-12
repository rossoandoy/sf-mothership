import { useEffect, useState } from 'react';
import { AVAILABLE_PACKS } from '@/types/pack';
import { getActivePack, setActivePack } from '@/packs/packLoader';
import type { ExecutionLogEntry } from '@/runtime/executionLogger';
import { getExecutionLogs } from '@/runtime/executionLogger';
import { getAppServerSettings, setAppServerSettings } from '@/api/appServerSettings';
import { checkAppServerHealth } from '@/api/appServerClient';
import { checkChromePromptAvailability, runChromePromptSmokeTest } from '@/api/aiProvider';
import {
  DEFAULT_AI_PROVIDER_SETTINGS,
  getAiProviderSettings,
  setAiProviderSettings,
} from '@/api/aiProviderSettings';
import { DEFAULT_APP_SERVER_URL } from '@/types/appServer';
import type { AiProviderMode, AiProviderSettings, AppServerSettings } from '@/types/appServer';
import { APP_VERSION } from '@/shared/version';

const AI_PROVIDER_OPTIONS: Array<{
  mode: AiProviderMode;
  label: string;
  description: string;
}> = [
  {
    mode: 'app-server-only',
    label: 'App Server only（推奨）',
    description: '既存の安定モード。Chrome Prompt は PoC ボタン以外では使いません。',
  },
  {
    mode: 'chrome-prompt-only',
    label: 'Chrome Prompt only（PoC）',
    description: 'オンデバイス限定検証。App Server へ fallback しません。',
  },
  {
    mode: 'hybrid',
    label: 'Hybrid（実験）',
    description: 'Chrome Prompt が ready のときだけ短い診断説明に使い、それ以外は App Server へ fallback します。',
  },
];

export function Options() {
  const [currentPack, setCurrentPack] = useState('default');
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<ExecutionLogEntry[]>([]);
  const [appServer, setAppServer] = useState<AppServerSettings>({
    enabled: false,
    baseUrl: DEFAULT_APP_SERVER_URL,
  });
  const [aiProvider, setAiProvider] = useState<AiProviderSettings>(DEFAULT_AI_PROVIDER_SETTINGS);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [chromeAiStatus, setChromeAiStatus] = useState<string | null>(null);
  const [checkingChromeAi, setCheckingChromeAi] = useState(false);
  const [testingChromeAi, setTestingChromeAi] = useState(false);

  useEffect(() => {
    getActivePack().then(setCurrentPack);
    getExecutionLogs().then(setLogs);
    getAppServerSettings().then(setAppServer);
    getAiProviderSettings().then(setAiProvider);
  }, []);

  const handlePackChange = async (packId: string) => {
    setSaving(true);
    await setActivePack(packId);
    setCurrentPack(packId);
    setSaving(false);
  };

  const handleAppServerSave = async () => {
    setSaving(true);
    await setAppServerSettings(appServer);
    setSaving(false);
    setHealthStatus(null);
  };

  const handleAiProviderSave = async () => {
    setSaving(true);
    await setAiProviderSettings(aiProvider);
    setSaving(false);
  };

  const handleHealthCheck = async () => {
    setCheckingHealth(true);
    setHealthStatus(null);
    await setAppServerSettings(appServer);
    const result = await checkAppServerHealth();
    setHealthStatus(result.ok ? `接続OK (${result.data.status})` : result.error);
    setCheckingHealth(false);
  };

  const handleChromeAiAvailability = async () => {
    setCheckingChromeAi(true);
    setChromeAiStatus(null);
    const availability = await checkChromePromptAvailability();
    setChromeAiStatus(
      availability.reason
        ? `${availability.status}: ${availability.reason}`
        : availability.status
    );
    setCheckingChromeAi(false);
  };

  const handleChromeAiSmokeTest = async () => {
    setTestingChromeAi(true);
    setChromeAiStatus(null);
    const result = await runChromePromptSmokeTest();
    setChromeAiStatus(
      result.ok
        ? `smoke OK: ${result.data.content}`
        : result.error
    );
    setTestingChromeAi(false);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">SF Mothership 設定</h1>
      <p className="text-sm text-gray-500 mb-6">v{APP_VERSION}</p>

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

      {/* AI provider 設定 */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">AI Provider 設定</h2>
        <p className="text-sm text-gray-500 mb-4">
          AI補助ツールの実行先を明示的に選びます。通常は App Server only のまま使ってください。
        </p>
        <div className="space-y-2 mb-4">
          {AI_PROVIDER_OPTIONS.map((option) => (
            <label
              key={option.mode}
              className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                aiProvider.mode === option.mode
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-2">
                <input
                  type="radio"
                  name="ai-provider-mode"
                  value={option.mode}
                  checked={aiProvider.mode === option.mode}
                  onChange={() => setAiProvider({ ...aiProvider, mode: option.mode })}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-800">{option.label}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                </div>
              </div>
            </label>
          ))}
        </div>
        <label className="flex items-start gap-2 mb-4">
          <input
            type="checkbox"
            checked={aiProvider.allowChromePromptInTools}
            onChange={(e) => setAiProvider({
              ...aiProvider,
              allowChromePromptInTools: e.target.checked,
            })}
            className="mt-0.5"
          />
          <span className="text-sm text-gray-700">
            通常の AI 補助ツールでも Chrome Prompt / Gemini Nano を候補にする
            <span className="block text-xs text-gray-500 mt-0.5">
              無効の場合、モデル作成はこの画面の PoC ボタンからだけ試します。
            </span>
          </span>
        </label>
        <button
          onClick={handleAiProviderSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          AI Provider 設定を保存
        </button>
      </section>

      {/* App Server 設定 */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Codex App Server（オプトイン）</h2>
        <p className="text-sm text-gray-500 mb-4">
          ローカルの Codex App Server に接続して AI 補助ツールを使用します。
          デフォルトでは無効です。sessionId 等の機密情報は送信しません。
        </p>
        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={appServer.enabled}
            onChange={(e) => setAppServer({ ...appServer, enabled: e.target.checked })}
          />
          <span className="text-sm text-gray-700">App Server 連携を有効化</span>
        </label>
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">Base URL</label>
          <input
            type="text"
            value={appServer.baseUrl}
            onChange={(e) => setAppServer({ ...appServer, baseUrl: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder={DEFAULT_APP_SERVER_URL}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAppServerSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            保存
          </button>
          <button
            onClick={handleHealthCheck}
            disabled={checkingHealth || !appServer.enabled}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {checkingHealth ? '確認中...' : '接続テスト'}
          </button>
        </div>
        {healthStatus && (
          <p className={`text-xs mt-3 ${healthStatus.startsWith('接続OK') ? 'text-green-600' : 'text-red-600'}`}>
            {healthStatus}
          </p>
        )}
      </section>

      {/* Chrome Built-in AI PoC */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Chrome Built-in AI / Gemini Nano（PoC）</h2>
        <p className="text-sm text-gray-500 mb-4">
          Chrome の Prompt API (`LanguageModel`) が Options 画面の document context で使えるか確認します。
          利用には対応 Chrome、端末要件、初回モデルダウンロードが必要です。
          `downloadable` / `downloading` の場合、通常ツールでは使わず、この画面の smoke prompt で明示的に検証してください。
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleChromeAiAvailability}
            disabled={checkingChromeAi || testingChromeAi}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {checkingChromeAi ? '確認中...' : 'availability 確認'}
          </button>
          <button
            onClick={handleChromeAiSmokeTest}
            disabled={checkingChromeAi || testingChromeAi}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {testingChromeAi ? '実行中...' : 'Smoke prompt'}
          </button>
        </div>
        {chromeAiStatus && (
          <p className="text-xs mt-3 text-gray-700 break-words">
            {chromeAiStatus}
          </p>
        )}
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
