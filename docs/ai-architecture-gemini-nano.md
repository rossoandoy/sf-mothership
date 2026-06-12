# Gemini Nano / Local AI Provider 比較検討

SF Mothership の AI 機能は、3タブの中核体験を置き換えるものではなく、診断説明・ツール定義生成・レポート分析を補助する任意機能として扱う。

対象リリース: v0.5.0〜v0.7.0

## 結論

- 短期: 現行 Codex App Server 互換 endpoint を Local AI Provider としてオプトイン継続する。
- 中期: Chrome Built-in AI Prompt API（Gemini Nano）を provider として追加し、用途別に routing する。
- 長期: deterministic core + reusable Chrome Extension AI Kit + optional AI providers とし、AI の可用性に依存しない UX を保つ。

## 比較

| 候補 | 強み | リスク | 判断 |
|------|------|--------|------|
| Local AI Provider | 日本語品質、構造化出力、重い分析に強い。Codex App Server / Ollama wrapper 等を差し替え可能 | localhost サーバ起動が必要。送信境界の説明が必要 | オプトイン継続 |
| Gemini Nano / Prompt API | オンデバイス、初回DL後オフライン、データ外部送信なし | Chrome/端末/モデルDL制約。Service Worker で直接使えない | PoC 対象 |
| ハイブリッド | 用途別に最適 provider を選べる | 抽象化しないと複雑化 | 中期推奨 |
| AI 後回し | 導入摩擦が低い | AI 補助の差別化が出ない | fallback 方針 |

## Chrome Built-in AI の前提

公式ドキュメント上、Prompt API は Chrome Extensions では Chrome 138 から、Web では Chrome 148 から利用可能とされる。Gemini Nano はオンデバイス実行だが、初回モデルダウンロード、Chrome バージョン、OS、CPU/RAM/GPU、ストレージ条件を満たす必要がある。

Prompt API は `LanguageModel.availability()` で利用可否を確認し、`LanguageModel.create()` で session を作成する。`availability()` は `unavailable` / `downloadable` / `downloading` / `available` を返す。Web Workers では利用できないため、MV3 Service Worker ではなく Side Panel や Options など document context から呼ぶ。

参照:

- [Built-in AI APIs](https://developer.chrome.com/docs/ai/built-in-apis)
- [Prompt API](https://developer.chrome.com/docs/ai/prompt-api)
- [Get started with built-in AI](https://developer.chrome.com/docs/ai/get-started)

## SF Mothership での方針

AI ツールはローカル HTTP 実装を直接呼ばず、`generateAi()` 経由にする。`generateAi()` は task と privacy に応じて provider を選ぶ。

| task | 優先 provider | 理由 |
|------|---------------|------|
| `diagnostic-explain` | Chrome Prompt → Local AI Provider | 短い日本語説明はオンデバイス PoC に向く |
| `tool-definition` | Local AI Provider → Chrome Prompt | JSON 生成と Salesforce 文脈の厳密性が重要 |
| `report-analyze` | Local AI Provider → Chrome Prompt | 分析計画・SOQL案は高品質モデルが有利 |

`privacy: onDeviceOnly` の場合は Chrome Prompt だけを候補にし、Local AI Provider へは送らない。

## 共通基盤化（v0.7.0）

AI 実行基盤は `src/ai/` に分離する。

```text
src/ai/
├── core/
│   ├── types.ts
│   └── router.ts
└── providers/
    ├── chromePromptProvider.ts
    └── localHttpProvider.ts
```

- `src/ai/core`: provider interface、routing、privacy 境界を持つ。
- `src/ai/providers`: Chrome Prompt と localhost HTTP provider の実装だけを持つ。
- `src/api/aiProvider.ts`: SF Mothership 向け adapter。Salesforce 固有 system prompt をここで注入する。
- `~/.cursor/skills/chrome-extension-ai-kit`: 他の Chrome 拡張へ移植するための個人 Agent Skill。

共通 provider は Salesforce の `PageContext`、SOQL、Describe、session sanitizer を知らない。各拡張は domain adapter で安全な payload を作り、共通 router に渡す。

## セキュリティ境界

- Local AI Provider は明示オプトイン時のみ利用する。
- Service Worker proxy は localhost / 127.0.0.1 のみ許可する。
- 許可 path は `/health` と `/v1/chat` に限定する。
- request size と timeout を設ける。
- `sessionId` / `sid` / `password` / `token` / `authorization` を含むキーは配列内オブジェクトまで再帰的に除去する。

## PoC チェックリスト

1. Options で `LanguageModel.availability()` が status を返す。
2. `downloadable` / `downloading` 時に UI が案内を出せる。
3. ユーザー操作から `LanguageModel.create()` と短い日本語 prompt が動く。
4. Gemini unavailable 時に Local AI Provider fallback が説明つきで働く。
5. アクセス診断説明の日本語品質を実データ 20 ケースで確認する。
6. ツール定義 JSON の parse / schema validation 成功率を測る。

## 手動 PoC 手順

1. Chrome を対応バージョンに更新する。
2. `chrome://flags/#optimization-guide-on-device-model` を Enabled にする。
3. Gemini Nano を使う場合は `chrome://flags/#prompt-api-for-gemini-nano` を Enabled または Enabled multilingual にする。
4. Chrome を再起動する。
5. 必要に応じて `chrome://on-device-internals` で model status を確認する。
6. SF Mothership の Options 画面を開き、`Chrome Built-in AI / Gemini Nano（PoC）` の `availability 確認` を押す。
7. `ready` なら `Smoke prompt` を押し、短い日本語応答が返ることを確認する。
8. `downloadable` / `downloading` の場合は、通常の AI 補助ツールでは使わず、この PoC ボタンで明示的に検証する。

通常ツール実行で `downloadable` / `downloading` の Chrome Prompt を自動利用しない理由:

- 初回モデルダウンロードは時間がかかり、3秒体験を壊す。
- `create()` に user activation が必要な場合がある。
- 端末要件や storage 不足で失敗する可能性がある。
- 現場利用では、モデル取得や送信先をユーザーが明示的に理解できることを優先する。

## AI Provider 設定

Options 画面では以下の3モードを選べる。

| mode | 用途 |
|------|------|
| `local-only` | デフォルト。localhost の Local AI Provider のみ使う |
| `chrome-prompt-only` | オンデバイス限定検証。Local AI Provider へ fallback しない |
| `hybrid` | Chrome Prompt が ready の場合だけ使い、それ以外は Local AI Provider へ fallback |

`allowChromePromptInTools` が false の場合、通常の AI 補助ツールは Chrome Prompt を候補にしない。Chrome Prompt のモデル作成は Options の PoC ボタンからだけ試す。

旧 `app-server-only` 設定は `local-only` として正規化する。
