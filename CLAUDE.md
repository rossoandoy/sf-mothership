# CLAUDE.md — SF Mothership

## プロジェクト概要

Salesforce導入現場で、その場の面倒をすぐ小ツール化するためのChrome拡張母艦。
Salesforce Inspector Reloaded方式で、ログイン済みブラウザのセッションを再利用し、
Side Panelから現在画面の文脈に応じた小ツールを提供する。

## 技術スタック

- Chrome Extension Manifest V3
- TypeScript (strict mode)
- React 18
- Vite (ビルドツール)
- Side Panel 中心UI（Popup は簡易メニューのみ）
- Tailwind CSS（ユーティリティ）

## アーキテクチャ4層

1. **Chrome Extension Layer**: Manifest V3, Service Worker, Content Script, Side Panel
2. **Salesforce Access Layer**: セッション再利用, REST API, Tooling API, Describe API
3. **Tool Runtime Layer**: Page Context → Tool Registry → Executor → Renderer
4. **Project Pack Layer**: 案件別ツール定義JSON + ガイド文面

## 設計原則

- **母艦思想**: 全部入りの巨大ツールではなく、小ツールを素早く追加できる基盤
- **定義駆動への漸進**: MVPではbuiltinコード実装OK。ただしToolDefinition型を通す
- **安全第一**: productionではwrite操作をデフォルト無効。confirm必須
- **責務分離**: api/ context/ runtime/ tools/ ui/ を明確に分離
- **DOM依存最小化**: URL/APIベースの取得を優先。DOM解析はadapterとして分離

## 命名規則

- ファイル: camelCase.ts / PascalCase.tsx（Reactコンポーネント）
- 型: PascalCase（interface/type）
- 定数: UPPER_SNAKE_CASE
- ツールID: kebab-case（例: quick-record-viewer）
- コメント: 日本語OK（ユーザー向けラベルは日本語、コード内コメントも日本語可）

## ディレクトリ構成

```
src/
├── background/          # Service Worker
├── content/             # Content Script（ページコンテキスト取得）
├── sidepanel/           # Side Panel UI（React）
├── popup/               # Popup（簡易メニュー）
├── options/             # Options Page（Pack切替等）
├── api/                 # Salesforce APIクライアント
├── context/             # ページコンテキスト解析
├── runtime/             # Tool Registry / Runtime / Safety
├── tools/builtins/      # MVP組込みツール5本
├── packs/               # Project Pack定義（JSON）
├── types/               # 共通型定義
└── shared/              # ユーティリティ
```

## MVP 5本

1. **Quick Record Viewer** (viewer/readOnly) — 現在レコードの周辺情報
2. **Field Context Inspector** (viewer/readOnly) — 項目API名・型・属性
3. **Access Diagnostic** (diagnostic/readOnly) — 権限・表示差異の原因候補
4. **Test Data Creator** (action/lowRiskWrite) — sandbox限定のテストデータ作成
5. **UAT Guide** (guide/readOnly) — 画面ごとのガイド表示

## 安全ルール

- `safety.allowInProd === false` のツールはproduction環境で実行不可
- `safety.requireConfirm === true` のツールは実行前にconfirmダイアログ必須
- `safety.maxAffectedRecords` を超える操作は拒否
- production判定: orgのisSandboxフラグ、またはドメインの--sandbox接尾辞で判定
- write系ツールは必ずdryRunプレビューを先に表示

## コード品質

- TypeScript strict mode必須
- any型禁止（unknownで受けてnarrowする）
- エラーはResult型パターン（{ok: true, data} | {ok: false, error}）で返す
- APIレスポンスはzodでバリデーション（将来対応。MVPでは型アサーションOK）
- console.logは共通loggerを経由（shared/logger.ts）

## 開発コマンド

```bash
npm run dev        # 開発ビルド（watch mode）
npm run build      # プロダクションビルド
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## ビルド出力

dist/ に生成。chrome://extensions → Load unpacked で読み込む。

## 重要な制約

- Manifest V3ではbackground pageではなくService Workerを使用
- Service Worker内ではDOM APIが使えない
- Content ScriptからAPIを直接叩くのではなく、Service Worker経由でproxy
- chrome.cookies APIでSalesforceドメインのsid cookieを取得して認証
- localStorageではなくchrome.storage.localを使用（Service Worker互換）
