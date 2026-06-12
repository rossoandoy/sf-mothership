# Chrome AI Kit Porting Guide

このガイドは、SF Mothership で整理した `src/ai/` の考え方を、別の Chrome 拡張へ移植するための手順。

## 何を移植するか

共通化する:

- `AiProvider` / `AiRequest` / `AiResponse` の型
- provider routing
- Chrome Prompt Provider
- Local AI Provider
- availability / health check の説明文
- `onDeviceOnly` / `localServerAllowed` の privacy 境界

各拡張に残す:

- その拡張固有の context 型
- prompt 文面
- secret sanitizer
- AI 出力の表示 UI
- write 操作や外部送信の confirm

## 推奨構成

```text
src/
├── ai/
│   ├── core/
│   │   ├── types.ts
│   │   ├── router.ts
│   │   └── output.ts
│   └── providers/
│       ├── chromePromptProvider.ts
│       ├── chromePromptAvailability.ts
│       ├── localHttpProvider.ts
│       └── localProviderDiagnostics.ts
└── features/
    └── summarizeSelection/
        └── adapter.ts
```

## 実装手順

1. `src/ai/` をコピーする。
2. 既存の拡張に `Result<T>` がない場合は、`{ ok: true, data } | { ok: false, error }` を追加する。
3. `chromePromptProvider` を Options / Side Panel / Popup など document context から呼ぶ。
4. Local AI Provider を使う場合は、Service Worker proxy で `localhost` / `127.0.0.1` のみ許可する。
5. 各機能で domain adapter を作り、`AiRequest` へ変換する。
6. `onDeviceOnly` を使うリクエストは、Local AI Provider や cloud provider へ fallback しない。
7. JSON が必要な機能は `outputMode: 'json'` と `responseSchema` を指定し、失敗時は draft として採用しない。

## 最小 adapter 例

選択テキストを要約する場合:

```ts
import { generateAiWithProviders } from './ai/core/router';
import { chromePromptProvider } from './ai/providers/chromePromptProvider';
import { localHttpProvider } from './ai/providers/localHttpProvider';

const providers = {
  'chrome-prompt': chromePromptProvider,
  'local-http': localHttpProvider,
};

export async function summarizeSelection(selectedText: string) {
  return generateAiWithProviders({
    task: 'summarize-selection',
    prompt: '次の選択テキストを日本語で3行以内に要約してください。',
    context: { source: 'selection' },
    data: { selectedText },
    locale: 'ja-JP',
    privacy: 'onDeviceOnly',
    outputMode: 'text',
    systemPrompt: 'You summarize selected browser text without exposing secrets.',
  }, providers, {
    mode: 'chrome-prompt-only',
    allowChromePromptInTools: true,
  });
}
```

完全なサンプルは [`docs/examples/chrome-ai-kit-minimal.ts`](examples/chrome-ai-kit-minimal.ts) を参照。

## よくある失敗

- MV3 Service Worker から `LanguageModel` を直接呼ぶ。
- `downloadable` の状態で通常ツールから自動ダウンロードを始める。
- `onDeviceOnly` のリクエストを localhost / cloud provider へ fallback する。
- AI 生成 JSON を validation せずに設定ファイルへ採用する。
- Local AI Provider の Base URL に LAN IP や remote host を許可する。
