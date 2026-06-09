# SF Mothership 現状棚卸し

最終更新: 2026-06-05（v0.2.0）

## バージョン参照箇所

| ファイル | 同期方法 |
|---------|---------|
| `package.json` | 正（npm version の起点） |
| `package-lock.json` | npm version で連動 |
| `manifest.json` | `scripts/sync-version.mjs` で同期 |
| `src/shared/version.ts` | `scripts/sync-version.mjs` で同期 |
| `src/sidepanel/App.tsx` | `APP_VERSION` 定数を参照 |

## 実装済み

- Chrome Extension MV3（Service Worker / Content Script / Side Panel / Popup / Options）
- Salesforce API（auth, SOQL, Describe, orgInfo, createRecord）
- Tool Runtime（Registry, Executor, SafetyGuard, DeclarativeEngine）
- Builtin ツール 8本 + 宣言的ツール 3本
- Project Pack（default / manabie）

## 未達だった Acceptance（v0.2.0 で対応）

- [x] toolExecutor 経由の実行ログ記録
- [x] Pack 切替時の宣言的ツール登録解除
- [x] UAT Guide の recordTypeMatch
- [x] Access Diagnostic の Profile / User Id 表示
- [x] SOQL nextRecordsUrl ページネーション
- [x] API version 動的取得
- [x] 最小テスト基盤（vitest）
- [x] Codex App Server 連携（オプトイン）
- [x] AI 補助ツール 3本

## Codex / App Server

- v0.2.0 より localhost への通信を **ユーザー明示オプトイン** で許可
- デフォルトは Salesforce のみ通信（README / safety ルール準拠）
- sessionId や生レコードデータの外部送信は禁止

## 今後の拡張候補（v0.3.0 以降）

- コンテキスト主導 3タブ UI
- Codex App Server 本体の同梱
- report-assistant 本格化（実データ集計）
- Service Worker 経由の Salesforce API プロキシ統一
- Tooling API クライアント
- 外部 Pack JSON の URL 読み込み
- zod による API レスポンスバリデーション
