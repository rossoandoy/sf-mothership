# Side Panel UX レビュー（v0.4.0 設計入力）

Codex によるレビュー結果。v0.4.0 実装済み改善と、次サイクル（v0.5.0 以降）の候補を整理する。

**レビュー対象**: `src/sidepanel/`, `docs/product-vision.md`  
**観点**: 情報過多、初回3秒体験、タブ設計、ローディング、拡張リロード時UX、Side Panel 幅制約

---

## v0.4.0 で実装済み

| 課題 | 対応 |
|------|------|
| Extension context invalidated | `extensionContext.ts` + Content Script の interval 停止 |
| 拡張リロード後の混乱 | `ExtensionStaleBanner` + `useExtensionStale` |
| 「今すぐ」情報過多 | `InstantSummary` でサマリ 1 画面化 |
| 関連件数 N+1 | `quickRecordViewer` 3 件上限 + `Promise.all` |
| タブ切替の再取得・直列実行 | `useTabPanel` キャッシュ + 並列実行 |

---

## P0（次に着手すべき）

### 1. 初回3秒が「答え」ではなくスピナーになる

**問題**: `useTabPanel` が `Promise.all` で全ツール完了まで待つため、1 つ遅い処理があると Instant 全体が表示されない。`TabPanelShell` は loading を汎用スピナーのみで表示する。

**提案**:
- `TabPanelState` に `partial` / `pendingToolIds` を追加し、各ツール完了ごとに部分表示
- `InstantPanel` は `loading` でも `results.length > 0` なら `InstantSummary` を出す
- スピナーは最終手段にし、最初から要約カード型スケルトンを表示

**影響ファイル**: `useTabPanel.ts`, `InstantPanel.tsx`, `InstantSummary.tsx`, `TabPanelShell.tsx`

### 2. 拡張リロード時 UX が検知・案内ともに弱い

**問題**: `context === null` が 3 秒続くと stale 扱いになり、非 Salesforce ページ・SW 遅延・実際の拡張更新が同じ表示になる。バナーはテキストのみで主操作がない。

**提案**:
- boolean ではなく `'loading' | 'notSalesforce' | 'staleContentScript' | 'serviceWorkerError' | 'ready'` の状態を返す
- `ExtensionStaleBanner` に「Salesforce タブを再読み込み」「再取得」ボタンを追加
- stale 時は通常タブのスピナーを止めて reload CTA を主表示にする

**影響ファイル**: `useExtensionStale.ts`, `ExtensionStaleBanner.tsx`, `App.tsx`, `usePageContext.ts`

---

## P1

### 3. objectHome の「今すぐ」がアクセス診断だけ

**問題**: objectHome では `instant` が `access-diagnostic` のみ。一覧画面の「今確認すべきこと」がユーザー/Profile/編集可否に寄りすぎる。

**提案**: `InstantSummary` に `pageContext` を渡し、objectHome 専用レイアウト（オブジェクト名/API名、CRUD バッジ、編集不可件数、項目タブ/ガイドへの導線）を作る。

**影響ファイル**: `InstantPanel.tsx`, `InstantSummary.tsx`, `tabTools.ts`

### 4. InstantSummary が狭幅で情報過多

**問題**: recordPage で Name・ユーザー・Profile・オブジェクト・編集可否・編集不可件数・関連 3 件がフラットに並ぶ。`w-24` 固定ラベルと `break-all` で長い値が読みづらい。

**提案**: 初期表示は 5 要素以内。最上段をレコード/オブジェクト、次に編集可否・編集不可件数をチップ化。ユーザー/Profile は補足に落とす。

**影響ファイル**: `InstantSummary.tsx`

### 5. タブ状態が文脈変更後も残る

**問題**: `activeTab` が App 内 state のため、別レコードへ移動しても前のタブから始まる。

**提案**: `context` の orgDomain/pageType/objectApiName/recordId 変更時に `activeTab` を `instant` へ戻す。Instant ready 後に fields/guide を遅延 prefetch。

**影響ファイル**: `App.tsx`, `ContextTabs.tsx`, `useTabPanel.ts`

### 6. キャッシュ更新意図が曖昧

**問題**: effect 依存に `pageContext.timestamp` があるがキャッシュキーに含まれない。同一レコード再取得時に古い cache が即返る。transient error も cache される。

**提案**: `cachedAt` 付き TTL、stale-while-revalidate、hard error 非永続化。objectHome では `url` または listViewId を cache key に含める。

**影響ファイル**: `useTabPanel.ts`

---

## P2

### 7. 固定ヘッダー/ContextBar/footer が本文面積を削る

**提案**: header 小型化、Sandbox 表示を ContextBar に統一、footer の Pack 表示を Drawer 内へ、「もっと見る」をタブ行右端アイコンに。

**影響ファイル**: `App.tsx`, `ContextBar.tsx`

### 8. 詳細表示が要約と重複

**提案**: 詳細は「アクセス診断詳細」「関連レコード詳細」など要約で見えていない部分だけを開く。ボタン文言を文脈化（例: `診断詳細`）。

**影響ファイル**: `InstantSummary.tsx`

---

## v0.4.0 実装時の P0 合意

本リリースでは計画確定分（サマリ化・キャッシュ・stale バナー・context invalidated 修正）を優先し、上記 P0 の部分表示・stale 状態細分化は **v0.5.0 候補** とする。
