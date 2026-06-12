# SF Mothership — Salesforce導入支援Chrome拡張母艦

Salesforce導入現場で、その場の面倒をすぐ小ツール化するためのChrome拡張基盤。

## コンセプト

Salesforce Inspector Reloaded方式で、ログイン済みブラウザのセッションを再利用。
Side Panelから現在画面の文脈に応じた小ツールを提供する。

**万能ツールではなく母艦**。案件ごとに必要な補助ツールを小さく追加できる。

## UI（v0.4.0）

Side Panel を開くと、ツール選択なしで以下が自動表示されます。

| タブ | 内容 |
|------|------|
| 今すぐ | サマリ 1 画面（Profile・主要項目・編集不可件数。詳細は展開） |
| 項目 | フィールド一覧（検索付き） |
| ガイド | UAT チェックリスト（Pack 連動） |

- タブ往復はキャッシュで即表示（同一文脈）
- 拡張リロード後は Salesforce タブの再読み込み案内を表示

テストデータ作成・AI 補助・宣言的ツールはフッターの「もっと見る」から。

詳細: [`docs/product-vision.md`](docs/product-vision.md) / [`docs/ui-redesign.md`](docs/ui-redesign.md) / [`docs/ux-review-v0.4.md`](docs/ux-review-v0.4.md)

## 技術スタック

- Chrome Extension Manifest V3
- TypeScript + React 18
- Vite
- Tailwind CSS
- Salesforce REST API / Tooling API

## ツール一覧

| # | ツール | カテゴリ | 安全レベル |
|---|--------|---------|-----------|
| 1 | Quick Record Viewer | viewer | readOnly |
| 2 | Field Context Inspector | viewer | readOnly |
| 3 | Access Diagnostic | diagnostic | readOnly |
| 4 | Test Data Creator | action | lowRiskWrite (sandbox only) |
| 5 | UAT Guide | guide | readOnly |
| 6 | ツール定義生成 (AI) | guide | readOnly (AI Provider) |
| 7 | アクセス診断 AI説明 | diagnostic | readOnly (AI Provider) |
| 8 | レポート分析 (AI) | guide | readOnly (AI Provider) |

## セットアップ

```bash
npm install
npm run dev          # 開発ビルド（watch）
npm run build        # プロダクションビルド
npm run test         # ユニットテスト
npm run local-ai:mock   # Local AI Provider mock 起動
npm run local-ai:ollama # Local AI Provider Ollama 起動
npm run sync-version # package.json → manifest / version.ts 同期
```

## Chrome拡張として読み込み

1. `npm run build`
2. Chrome → `chrome://extensions/`
3. Developer mode ON
4. Load unpacked → `dist/` フォルダを選択

## プロジェクト構成

```
CLAUDE.md                    # Claude Code向けプロジェクト定義
.claude/rules/               # Claude Code向けルール
docs/                        # ハンドオフドキュメント一式
src/
├── background/              # Service Worker
├── content/                 # Content Script
├── sidepanel/               # Side Panel UI (React)
├── popup/                   # Popup
├── options/                 # Options Page
├── api/                     # Salesforce APIクライアント
├── context/                 # ページコンテキスト解析
├── runtime/                 # Tool Registry / Runtime / Safety
├── tools/builtins/          # MVP組込みツール
├── packs/                   # Project Pack定義
├── types/                   # 共通型定義
└── shared/                  # ユーティリティ
```

## ドキュメント

- `docs/00_project_handoff.md` — プロジェクト全体像
- `docs/acceptance_criteria.md` — 受け入れ条件
- `docs/risks_and_safety.md` — リスクと安全設計
- `docs/sample_tool_definitions.json` — ツール定義サンプル
- `docs/claude_code_bootstrap_prompt.md` — Claude Code実行指示
- `docs/ai-architecture-gemini-nano.md` — Gemini Nano / Local AI Provider 比較検討
- `docs/local-ai-provider.md` — Local AI Provider API仕様
- `docs/chrome-ai-kit-porting-guide.md` — 他Chrome拡張へのAI Kit移植手順

## 宣言的ツール定義

JSONだけで新しいSalesforceツールを作成できます。TypeScriptコード不要。

```json
{
  "id": "my-tool",
  "title": "カスタムツール",
  "operations": [
    { "type": "describe", "stepId": "desc" }
  ],
  "output": {
    "type": "table",
    "mapping": {
      "type": "table",
      "sourceStepId": "desc",
      "rowsPath": "fields",
      "columns": [
        { "key": "name", "label": "API名", "value": "{{row.name}}" }
      ]
    }
  }
}
```

詳細: [`docs/tool-authoring-guide.md`](docs/tool-authoring-guide.md) / [`docs/tool-recipes.md`](docs/tool-recipes.md)

## AI Provider 連携（オプトイン）

AI補助ツール（ツール定義生成、アクセス診断説明、レポート分析）は provider routing 経由で実行します。
v0.7.0 では AI 実行基盤を `src/ai/` に分離し、Chrome Built-in AI / Gemini Nano と Local AI Provider を共通 router で扱います。
v0.8.0 では JSON / draft / text の出力境界、availability 説明、Local AI Provider onboarding、他Chrome拡張への移植ガイドを追加しました。
v0.9.0 では `local-ai-provider/` に mock / Ollama 対応の Local AI Provider starter を同梱しました。

1. Options画面で AI Provider を選択（デフォルトは Local AI Provider only）
2. Local AI Provider を使う場合は `npm run local-ai:mock` で starter を起動し、「Local AI Provider 連携を有効化」
3. デフォルト URL: `http://127.0.0.1:3847`
4. 接続テストで `/health` エンドポイントを確認
5. Gemini Nano PoC は Options 画面の `availability 確認` / `Smoke prompt` で明示的に実行
6. Ollama を使う場合は `ollama pull llama3.2:3b` 後に `npm run local-ai:ollama`

Local AI Provider は以下の API を実装してください:

- `GET /health` → `{ "status": "ok" }`
- `POST /v1/chat` → `{ "content": "..." }`

Chrome Built-in AI / Gemini Nano の検証手順は [`docs/ai-architecture-gemini-nano.md`](docs/ai-architecture-gemini-nano.md) を参照してください。
Local AI Provider の API 仕様は [`docs/local-ai-provider.md`](docs/local-ai-provider.md)、他Chrome拡張への移植手順は [`docs/chrome-ai-kit-porting-guide.md`](docs/chrome-ai-kit-porting-guide.md) を参照してください。

## 安全設計

- Production環境ではwrite系ツールがデフォルト無効
- 全write操作にconfirmダイアログ必須
- デフォルトはSalesforceサーバーとのみ通信
- localhost 通信はユーザー明示オプトイン時のみ
- sessionId 等の機密情報は Local AI Provider に送信しない
- Local AI Provider proxy は `/health` と `/v1/chat` のみ許可
- AI provider はオンデバイス限定 / localhost 許可の privacy 境界で routing
- セッションIDのログ出力禁止

## Acknowledgments

本プロジェクトは以下のオープンソースプロジェクトの技術・パターンに大きく依拠しています。

### [Salesforce Inspector Reloaded](https://github.com/tprouvot/Salesforce-Inspector-reloaded)

by Thomas Prouvot (MIT License) / Original: [Salesforce Inspector](https://github.com/sorenkrabbe/Chrome-Salesforce-inspector) by Soren Krabbe

50,000+ ユーザーを持つChrome拡張。SF Mothershipの認証方式（cookie-based session reuse）、
Lightning→MyDomainドメイン変換、REST API通信パターン、レコードID検証、sandbox判定など
核心的な技術基盤はSIRの実装に学んでいます。

### [sf-custom-config-tool](https://github.com/rossoandoy/sf-custom-config-tool)

Service Workerをcookie broker専任とし、UI側から直接Salesforce APIをfetchする
安定した接続パターンを参考にしています。

詳細な対応表は [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) を参照してください。
