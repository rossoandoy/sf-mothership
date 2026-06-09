# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/lang/ja/).

## [Unreleased]

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
