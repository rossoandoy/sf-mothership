# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/lang/ja/).

## [Unreleased]

### Added

- Gemini Nano / Codex App Server 比較ドキュメント `docs/ai-architecture-gemini-nano.md`
- AI provider 抽象 (`generateAi`) と Chrome Built-in AI / Gemini Nano PoC
- Options 画面に Chrome Prompt API availability / smoke prompt 確認を追加
- Options 画面に AI provider mode（App Server only / Chrome Prompt only / Hybrid）設定を追加

### Changed

- AI 補助ツールを App Server 直呼びから provider routing 経由に変更
- 通常ツール実行では Chrome Prompt を明示許可 + `ready` の場合にのみ候補化
- App Server proxy の許可 path / request size / timeout を制限
- App Server 送信前 sanitizer を配列内オブジェクトまで再帰処理

## [0.4.0] - 2026-06-09

### Added

- `InstantSummary` — 「今すぐ」タブのサマリ 1 画面化（詳細は展開）
- `useTabPanel` キャッシュ + 並列ツール実行
- `ExtensionStaleBanner` — 拡張リロード後の Salesforce タブ再読み込み案内
- `docs/ux-review-v0.4.md` — Codex UX レビュー結果（P0/P1/P2）
- `useTabPanel` / `extensionContext` のユニットテスト

### Changed

- `quickRecordViewer` の関連件数を 3 件上限 + COUNT 並列化
- Pack 切替時にタブパネルキャッシュをクリア

## [0.3.1] - 2026-06-09

### Fixed

- 拡張リロード後に古い Content Script が `Extension context invalidated` を投げ続ける問題
- `isExtensionContextValid` / `safeSendMessage` によるコンテキスト検証と監視停止

## [0.3.0] - 2026-06-05

### Added

- コンテキスト主導 UI: 「今すぐ」「項目」「ガイド」の3タブ自動表示
- `ContextBar` / `ContextTabs` / タブパネルコンポーネント
- `useTabPanel` フック（タブ切替時の自動ツール実行）
- 「もっと見る」ドロワー（上級ツール・AI・Pack 宣言的ツール）
- `getDrawerTools` — App Server 無効時に AI ツールを非表示
- プロダクトビジョン・UI 再設計ドキュメント

### Changed

- Side Panel の主画面をツール一覧からタブ UI に全面変更
- テストデータ作成ツールを `advanced` タグ付きドロワー導線に移動

## [0.2.0] - 2026-06-05

### Added

- バージョン同期スクリプト `scripts/sync-version.mjs` と `src/shared/version.ts`
- 現状棚卸しドキュメント `docs/status-inventory.md`
- vitest による最小テスト基盤（urlParser, safetyGuard, templateEngine, packRegistry）
- SOQL `nextRecordsUrl` 自動ページネーション（`queryAll`）
- Salesforce API version の動的取得
- UAT Guide の `recordTypeMatch` フィルタ
- Access Diagnostic の User Id / Profile 名表示
- Codex App Server 連携（オプトイン、Service Worker プロキシ）
- AI 補助ツール: ツール定義生成、診断説明、レポート分析
- Options 画面に App Server 設定セクション

### Fixed

- `useToolExecution` が `toolExecutor` をバイパスしていた問題（実行ログが記録されない）
- Pack 切替時に前 Pack の宣言的ツールが残る問題
- Side Panel ヘッダーのバージョン表示がハードコードされていた問題

### Changed

- 安全ポリシー: localhost 通信はユーザー明示オプトイン時のみ許可

## [0.1.0] - 2026-06-05

### Added

- SF Mothership MVP — Chrome 拡張母艦
- Builtin ツール 5本（Quick Record Viewer, Field Context Inspector, Access Diagnostic, Test Data Creator, UAT Guide）
- 宣言的ツール定義エンジン
- Project Pack（default / manabie）
- Salesforce Inspector Reloaded 方式の cookie 認証
