# SF Mothership 現状棚卸し

最終更新: 2026-06-12（v0.9.0）

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
- コンテキスト主導 3タブ UI + 上級ツールドロワー
- Extension context invalidated 修正（v0.3.1）
- InstantSummary / タブキャッシュ / stale バナー（v0.4.0）
- Codex UX レビュー記録 `docs/ux-review-v0.4.md`
- AI provider abstraction / Gemini Nano PoC（v0.5.0）
- App Server proxy hardening（path allowlist / timeout / request size）
- App Server 送信前 sanitizer の深い再帰処理
- Side Panel UX hardening（v0.6.0: 部分表示 / 状態別 stale バナー / active tab reset / cache TTL）
- Chrome Extension AI Kit 境界（`src/ai/core` / `src/ai/providers`）と個人 Agent Skill
- Chrome AI Kit portability（schema-safe output / availability説明 / Local AI Provider onboarding / porting guide）
- Local AI Provider starter（`local-ai-provider/`: mock / Ollama wrapper / safety / node:test）

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

## AI Provider / Local AI Provider

- v0.2.0 より localhost への通信を **ユーザー明示オプトイン** で許可
- デフォルトは Salesforce のみ通信（README / safety ルール準拠）
- sessionId や生レコードデータの外部送信は禁止
- v0.5.0 より AI provider mode（App Server only / Chrome Prompt only / Hybrid）を Options で明示設定
- v0.7.0 より `local-only` / `chrome-prompt-only` / `hybrid` へ正規化し、旧 `app-server-only` は後方互換で受け入れ
- v0.8.0 より AI output mode（text / json / draft）と schema-safe output を導入
- v0.8.0 より Local AI Provider 接続失敗理由を分類して Options に表示
- v0.9.0 より無料ローカル実行の starter を同梱し、`npm run local-ai:mock` / `npm run local-ai:ollama` で起動可能
- Chrome Built-in AI / Gemini Nano は Options 画面の PoC ボタンで availability / smoke prompt を明示実行

## UX 改善状況（v0.6.0、ux-review-v0.4 より）

- [x] 部分表示（ツール完了ごとの InstantSummary 更新）
- [x] stale 状態の細分化と再読み込み CTA ボタン
- [x] 文脈変更時の activeTab リセット
- [x] キャッシュ TTL / error 非永続化
- objectHome 専用 Instant レイアウト

## 今後の拡張候補（v0.9.0 以降）

- objectHome 専用 Instant レイアウト
- cache stale-while-revalidate
- LM Studio wrapper の追加
- report-assistant 本格化（実データ集計）
- Service Worker 経由の Salesforce API プロキシ統一
- Tooling API クライアント
- 外部 Pack JSON の URL 読み込み
- zod による API レスポンスバリデーション
