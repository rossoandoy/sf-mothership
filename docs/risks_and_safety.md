# Risks and Safety

## 1. Salesforce DOM依存
**リスク**: Lightning DOMは頻繁に変わる。画面上の項目抽出は壊れやすい。
**方針**: URL/APIベースの取得を優先。DOM依存部分はcontent/domContext.tsにadapterとして隔離。

## 2. セッション/認証
**リスク**: cookie取得やセッション有効期限の扱い。
**方針**: 既存ログイン済みコンテキスト前提。セッション切れは明確なエラーメッセージ。リトライではなく再ログイン誘導。

## 3. 本番更新事故
**リスク**: 便利さの反面、本番での誤更新が致命的。
**方針**:
- productionではwrite系をデフォルト無効
- allowInProdフラグで個別制御
- maxAffectedRecords上限
- preview/dry-run先行
- confirmダイアログ必須
- MVPでは大量更新を扱わない

## 4. ツール乱立
**リスク**: 母艦に場当たり的なツールが増えると保守破綻。
**方針**: category + projectTags + enabled で管理。Pack単位で整理。builtin/pack toolを区別。

## 5. 宣言的基盤の過剰設計
**リスク**: 最初から複雑なDSLを作ると進まない。
**方針**: MVPでは薄いToolDefinition。operationsはbuiltin handler名のみ。将来JSONベースに漸進。

## 6. API Rate Limit
**リスク**: Describe等のキャッシュなし連打でAPI制限に抵触。
**方針**: Describeはchrome.storage.localにキャッシュ（TTL: 1時間）。API統計はログに記録。

## 7. マルチタブ
**リスク**: 複数のSalesforceタブが開いている場合の文脈混同。
**方針**: activeTabのURLを都度取得。Side Panel表示時にアクティブタブを再チェック。
