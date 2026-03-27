# Claude Code Bootstrap Prompt

以下をClaude Codeにそのまま渡す。

---

## 指示

このリポジトリで Chrome拡張の実装を開始してください。

### 最初に読むファイル
1. `CLAUDE.md` — プロジェクト全体の設計原則・技術スタック・ディレクトリ構成
2. `docs/00_project_handoff.md` — プロジェクト背景・アーキテクチャ・MVP仕様
3. `docs/sample_tool_definitions.json` — ToolDefinitionの具体例5本
4. `docs/acceptance_criteria.md` — 完了条件
5. `.claude/rules/` — アーキテクチャルール・安全ルール

### ゴール
MVP として以下5本を Side Panel から使える状態にする。

1. Quick Record Viewer（現在レコードの周辺情報）
2. Field Context Inspector（項目API名・型・属性）
3. Access Diagnostic（権限・表示差異の原因候補）
4. Test Data Creator（sandbox限定テストデータ作成）
5. UAT Guide（画面ごとのガイド表示）

### 実装方針
- Manifest V3 + TypeScript + React + Vite
- Side Panel 中心
- 将来の定義駆動化を見据えた構造
- まずは built-in tool として実装してよい
- JSON pack 読み込みの入口は用意する
- 書き込み系は安全制御を強くかける

### 進め方
```
Step 1: 拡張骨組み
  - manifest.json, package.json, tsconfig.json, vite.config.ts
  - src/ 初期構成
  - Side Panel の最小UI（React）

Step 2: Context取得
  - Content Script: URL解析でorg domain, object, recordId, pageType
  - Service Worker: message passing でSide Panelに文脈を伝達

Step 3: APIクライアント
  - chrome.cookies でsid取得
  - REST client（SOQL実行）
  - Describe client（オブジェクト/項目メタデータ）
  - 共通エラーハンドリング

Step 4: Tool Registry / Runtime
  - types/tool.ts にToolDefinition型
  - runtime/toolRegistry.ts にregistry
  - contextに合うtoolをフィルタ

Step 5: MVP 5本
  - builtins/ に各ハンドラ実装
  - Side PanelのUIと接続

Step 6: Safety / Pack
  - production判定
  - write confirm
  - packs/default/tools.json 読み込み

Step 7: 仕上げ
  - エラー表示改善
  - README更新
```

### 最初のアウトプット
まず以下を作ってください:
- Chrome extension の基本ファイル一式（manifest.json, package.json等）
- Side Panel の最小UI（文脈表示カード + ツール一覧プレースホルダ）
- Content Script → Service Worker → Side Panel のメッセージパッシング
- URL parserでSalesforceのrecordId / objectApiName取得
- Quick Record Viewer の最小動作版

### 重要
- いきなり完璧な宣言的基盤を目指さない
- ただし ToolDefinition 型を通すことで将来の定義駆動を壊さない
- ハードコードが必要でも、責務分離は崩さない
- 書き込み操作は prod で無効、または明示確認必須で設計する
- any型禁止。Result型パターンでエラーを返す
