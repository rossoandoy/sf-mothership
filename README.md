# SF Mothership — Salesforce導入支援Chrome拡張母艦

Salesforce導入現場で、その場の面倒をすぐ小ツール化するためのChrome拡張基盤。

## コンセプト

Salesforce Inspector Reloaded方式で、ログイン済みブラウザのセッションを再利用。
Side Panelから現在画面の文脈に応じた小ツールを提供する。

**万能ツールではなく母艦**。案件ごとに必要な補助ツールを小さく追加できる。

## 技術スタック

- Chrome Extension Manifest V3
- TypeScript + React 18
- Vite
- Tailwind CSS
- Salesforce REST API / Tooling API

## MVP ツール

| # | ツール | カテゴリ | 安全レベル |
|---|--------|---------|-----------|
| 1 | Quick Record Viewer | viewer | readOnly |
| 2 | Field Context Inspector | viewer | readOnly |
| 3 | Access Diagnostic | diagnostic | readOnly |
| 4 | Test Data Creator | action | lowRiskWrite (sandbox only) |
| 5 | UAT Guide | guide | readOnly |

## セットアップ

```bash
npm install
npm run dev          # 開発ビルド（watch）
npm run build        # プロダクションビルド
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

## 安全設計

- Production環境ではwrite系ツールがデフォルト無効
- 全write操作にconfirmダイアログ必須
- データはSalesforceサーバーとのみ通信（第三者送信なし）
- セッションIDのログ出力禁止
