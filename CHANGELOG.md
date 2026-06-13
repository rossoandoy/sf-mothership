# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/lang/ja/).

## [Unreleased]

## [0.12.0] - 2026-06-14

### Added

- Salesforce API Service Worker proxy（`SALESFORCE_API_REQUEST`）
- Service Worker 側 Salesforce API dispatcher と unit test
- Side Panel `callApi()` の runtime message proxy test

### Changed

- Side Panel からの Salesforce REST API 直接 fetch を廃止し、Service Worker 経由に統一
- UI 側へ `sessionId` / `apiHostname` を返さず、Service Worker 内で session を扱う構造へ変更
- README / status / acceptance / safety rule に Salesforce API proxy 境界を追記

## [0.11.0] - 2026-06-13

### Added

- レポート分析 (AI) の read-only 集計スナップショット（総件数 / 直近件数 / 分布）
- 集計スナップショット helper と collector の unit test
- レポート分析 handler test（snapshot payload / unsafe object API name / warning 表示）
- レポート分析の集計期間入力（直近7日 / 30日 / 90日）

### Changed

- レポート分析 AI の prompt に集計スナップショット根拠を追加
- レポート分析結果に `集計スナップショット` / `実行した SOQL` / `集計 warnings` を表示
- README / Local AI Provider docs に「AIへ送るのは集計値とSOQLのみ」と明記

## [0.10.0] - 2026-06-13

### Added

- Options 画面に Local AI Provider 専用の `/v1/chat` Smoke prompt を追加
- `local-ai:smoke` CLI による起動済み provider の `/health` + `/v1/chat` 検証
- Local AI Provider smoke helper と unit test
- CLI smoke logic の node:test

### Changed

- README / Local AI Provider docs / Chrome AI Kit skill に mock → CLI smoke → Options smoke の確認手順を追加
- Local smoke payload が Salesforce session / token / record data を含まないことを明文化

## [0.9.0] - 2026-06-12

### Added

- `local-ai-provider/` starter（Node標準APIのみ）を同梱
- mock provider による deterministic な `/v1/chat` 応答
- Ollama wrapper（`/v1/chat` → Ollama `/api/generate`）と `OLLAMA_MODEL` / `OLLAMA_BASE_URL` 設定
- Local AI Provider starter の node:test（health / chat / body limit / 404 / CORS / sanitizer）
- Chrome AI Kit skill の Local AI Provider starter reference

### Changed

- README / Local AI Provider docs に mock / Ollama 起動手順を追加
- root scripts に `local-ai:mock` / `local-ai:ollama` を追加

### Security

- provider 側にも 64KB body limit、path allowlist、secret-like key mask、最小 CORS を追加

## [0.8.0] - 2026-06-12

### Added

- AI Kit の `outputMode`（text / json / draft）と schema-safe output 後処理
- Chrome Prompt availability の状態別ユーザー向け説明
- Local AI Provider onboarding docs と Options 上の API 仕様表示
- 他Chrome拡張向け porting guide と最小サンプル
- AI ツール表示条件の設定組み合わせテスト

### Changed

- `responseSchema` 付き AI 出力は JSON parse / schema validation 失敗時に error として扱う
- Local AI Provider 接続テストの失敗理由を URL / server stopped / CORS / HTTP error に分類

## [0.7.0] - 2026-06-12

### Added

- Chrome拡張AI化の共通実行基盤 `src/ai/core` / `src/ai/providers`
- 個人 Agent Skill `~/.cursor/skills/chrome-extension-ai-kit`
- Gemini Nano / Local AI Provider を切り替える AI tool availability 判定

### Changed

- AI provider 実装を Salesforce adapter と共通 provider に分離
- `App Server only` を `Local AI Provider only` へ正規化し、旧 `app-server-only` 設定を後方互換で受け入れ
- Options / docs の AI 表現を Codex App Server 固定から Local AI Provider 中心に変更

## [0.6.0] - 2026-06-12

### Added

- Side Panel の部分表示: タブ内ツールが完了した順に `InstantSummary` を更新
- `ExtensionStatus` による状態別バナー（waiting / stale content script / Service Worker error）
- 文脈 identity 変更時の「今すぐ」タブ自動復帰
- タブパネルキャッシュ TTL（5分）と URL 差分対応

### Changed

- 初回読み込みを汎用スピナーから要約カード型スケルトンへ変更
- transient error をタブパネルキャッシュへ永続化しないよう変更

## [0.5.0] - 2026-06-12

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
