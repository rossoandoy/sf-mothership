# Acceptance Criteria

## 全体
- [x] Chrome拡張としてビルドでき、chrome://extensions でロードできる
- [x] Salesforceタブ上でSide Panelが開く
- [x] Side Panelに現在文脈（org domain, object, record id, page type）が表示される
- [x] 文脈に応じた利用可能ツール一覧が表示される

## Context Resolver
- [x] Salesforce Lightning URL から org domain が取れる
- [x] record page で record id（18桁）が取れる
- [x] object API name が取れる（標準/カスタム両対応）
- [x] page type（recordPage / objectHome / setupPage / other）が判定できる
- [x] sandbox / production が判定できる

## API Layer
- [x] cookie からセッションIDを取得できる
- [x] REST APIでSOQLが実行できる
- [x] Describe APIでオブジェクト/項目メタデータが取得できる
- [x] 401/403エラー時にUIへ認証エラーメッセージを返せる
- [x] ネットワークエラー時にリトライなしで適切なエラー表示
- [x] API version を動的取得できる
- [x] SOQL nextRecordsUrl ページネーションに対応

## Tool Runtime
- [x] ToolDefinition型に準拠したツール定義が読み込める
- [x] pageMatch / objectMatch で文脈に合うツールをフィルタできる
- [x] inputsに基づいた入力フォームが生成できる
- [x] 結果をカード or テーブルで表示できる
- [x] toolExecutor 経由で実行ログが記録される

## MVP 1: Quick Record Viewer
- [x] 現在レコードの主要項目（Name, CreatedDate, LastModifiedDate等）が表示される
- [x] 関連オブジェクトの件数が表示される（少なくとも1リレーション）
- [x] レコードページ以外では非表示

## MVP 2: Field Context Inspector
- [x] 現在オブジェクトの項目一覧が表示される
- [x] API名、ラベル、型、必須、数式かどうかが確認できる
- [x] updateable / createable が確認できる
- [x] フィルタ/検索ができる

## MVP 3: Access Diagnostic
- [x] 現在ユーザーの情報（User Id, Profile名）が表示される
- [x] 対象オブジェクトの各項目のFLS（readable/updateable）が確認できる
- [x] 読めない/編集できない項目の原因候補が提示される

## MVP 4: Test Data Creator
- [x] sandbox環境でのみ実行可能
- [x] production環境ではツール自体が非表示またはdisabled
- [x] 実行前にconfirmダイアログが表示される
- [x] 必須項目を自動検出して入力フォームに含める
- [x] 作成されたレコードのIDとリンクが表示される

## MVP 5: UAT Guide
- [x] pageMatch + objectMatch に応じてガイドが切り替わる
- [x] recordTypeMatch に応じてガイドがフィルタされる
- [x] Project PackのJSONからガイド文面を読み込める
- [x] ガイドが存在しない画面では「ガイドなし」表示

## Safety
- [x] production判定が正しく動作する
- [x] allowInProd === false のツールがproductionで実行不可
- [x] write系ツールでconfirmを経ないと実行しない
- [x] maxAffectedRecords 超過時に拒否される

## Project Pack
- [x] default packが読み込める
- [x] manabie packサンプルが存在する
- [x] Options画面でPack切替が可能
- [x] Pack切替時に前Packの宣言的ツールが解除される

## Codex App Server（v0.2.0）
- [x] Options画面でオプトイン設定ができる
- [x] Service Worker 経由で localhost にプロキシできる
- [x] sessionId 等の機密情報を送信しない
- [x] AI補助ツール 3本が登録されている

## テスト
- [x] vitest によるユニットテストが実行できる
- [x] lint / typecheck / build が通る

## UI 体験（v0.3.0）
- [x] Side Panel 起動後、ツール選択なしで「今すぐ」タブにレコード概要が表示される
- [x] 項目タブで検索が即座に効く
- [x] ガイドタブで Manabie Pack 切替時にガイドが変わる
- [x] Production でテストデータ作成がドロワーからも実行不可（非表示）
- [x] App Server 無効時、AI ツールが UI に出ない

## 安定性・UX（v0.3.1 / v0.4.0）
- [x] 拡張リロード後、古い Salesforce タブで `Extension context invalidated` が繰り返し出ない（interval 停止）
- [x] 拡張リロード後、コンテキスト未取得時に再読み込み案内バナーが表示される
- [x] 「今すぐ」タブがサマリ 1 画面で表示される（詳細は展開）
- [x] objectHome（一覧画面）で「今すぐ」= アクセス診断サマリ（empty ではない）
- [x] タブ往復で同一文脈はキャッシュから即表示される
- [x] 関連レコード件数は最大 3 件・並列 COUNT

## AI Provider / Gemini Nano PoC（v0.5.0）
- [x] AI provider mode（App Server only / Chrome Prompt only / Hybrid）を Options 画面で設定できる
- [x] デフォルトは App Server only で、Chrome Prompt は通常ツール実行の候補にならない
- [x] Chrome Prompt / Gemini Nano は Options 画面の availability / smoke prompt で明示検証できる
- [x] Chrome Prompt は `ready` の場合のみ通常 AI ツールの provider 候補になる
- [x] AI ツール結果に provider と処理先（オンデバイス処理 / localhost App Server）が表示される
- [x] App Server proxy は `/health` と `/v1/chat` 以外の path を拒否する
- [x] App Server proxy は request size と timeout を制限する
- [x] App Server 送信前 sanitizer はネスト・配列内の secret-like key を除去する

## Side Panel UX Hardening（v0.6.0）
- [x] 「今すぐ」タブで、複数ツールのうち先に完了した結果から部分表示される
- [x] 初回読み込みは汎用スピナーではなく要約カード型スケルトンを表示する
- [x] 拡張状態は waiting / stale content script / Service Worker error を区別して案内できる
- [x] Service Worker 一時不調では `再取得` CTA からページ文脈を再取得できる
- [x] 文脈変更（recordId / objectApiName / objectHome URL）時に active tab が「今すぐ」へ戻る
- [x] タブパネルキャッシュは 5分 TTL を持ち、error 状態を永続化しない
- [x] objectHome/list view の URL 差分がタブパネルキャッシュキーに反映される

## Chrome Extension AI Kit（v0.7.0）
- [x] AI provider の共通型・router・provider 実装が `src/ai/` に分離されている
- [x] Salesforce 固有 system prompt / context shaping は `src/api/aiProvider.ts` adapter 側に残っている
- [x] `local-only` / `chrome-prompt-only` / `hybrid` の provider mode を扱える
- [x] 旧 `app-server-only` 設定は `local-only` として後方互換で正規化される
- [x] `onDeviceOnly` request は Chrome Prompt 以外へ流れない
- [x] Gemini Nano / Prompt API の実装手順が個人 Agent Skill として再利用できる

## Chrome AI Kit Portability（v0.8.0）
- [x] AI 出力を `text` / `json` / `draft` の output mode で扱える
- [x] `json` mode では JSON parse / schema validation 失敗が error になる
- [x] `draft` mode では不正 JSON でも下書き text として扱える
- [x] Chrome Prompt availability は raw status ではなく状態別説明文で表示される
- [x] Local AI Provider 接続テストは URL / server stopped / CORS / HTTP error を分類して説明する
- [x] Options から `/health` / `/v1/chat` の期待 API 仕様を確認できる
- [x] 他Chrome拡張向け porting guide と最小サンプルが存在する
- [x] AIツール表示条件は provider 設定の組み合わせでテストされている

## Local AI Provider Starter（v0.9.0）
- [x] `local-ai-provider/` に Node.js 標準 API の starter が存在する
- [x] `GET /health` が `{ "status": "ok" }` を返す
- [x] mock provider で `/v1/chat` が deterministic な応答を返す
- [x] Ollama wrapper が `/v1/chat` request を Ollama `/api/generate` に変換できる
- [x] Ollama 未起動時に `Ollama is not reachable` を含む error を返す
- [x] provider 側でも 64KB body limit / path allowlist / secret-like key mask を持つ
- [x] preflight `OPTIONS` は wildcard origin なしで必要最小限に通る
- [x] root script `local-ai:mock` / `local-ai:ollama` で起動できる
- [x] `node --test local-ai-provider/src/*.test.mjs` が通る
- [x] Chrome AI Kit skill に Local Provider starter 手順がある
