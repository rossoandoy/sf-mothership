# Acceptance Criteria

## 全体
- [ ] Chrome拡張としてビルドでき、chrome://extensions でロードできる
- [ ] Salesforceタブ上でSide Panelが開く
- [ ] Side Panelに現在文脈（org domain, object, record id, page type）が表示される
- [ ] 文脈に応じた利用可能ツール一覧が表示される

## Context Resolver
- [ ] Salesforce Lightning URL から org domain が取れる
- [ ] record page で record id（18桁）が取れる
- [ ] object API name が取れる（標準/カスタム両対応）
- [ ] page type（recordPage / objectHome / setupPage / other）が判定できる
- [ ] sandbox / production が判定できる

## API Layer
- [ ] cookie からセッションIDを取得できる
- [ ] REST APIでSOQLが実行できる
- [ ] Describe APIでオブジェクト/項目メタデータが取得できる
- [ ] 401/403エラー時にUIへ認証エラーメッセージを返せる
- [ ] ネットワークエラー時にリトライなしで適切なエラー表示

## Tool Runtime
- [ ] ToolDefinition型に準拠したツール定義が読み込める
- [ ] pageMatch / objectMatch で文脈に合うツールをフィルタできる
- [ ] inputsに基づいた入力フォームが生成できる
- [ ] 結果をカード or テーブルで表示できる

## MVP 1: Quick Record Viewer
- [ ] 現在レコードの主要項目（Name, CreatedDate, LastModifiedDate等）が表示される
- [ ] 関連オブジェクトの件数が表示される（少なくとも1リレーション）
- [ ] レコードページ以外では非表示

## MVP 2: Field Context Inspector
- [ ] 現在オブジェクトの項目一覧が表示される
- [ ] API名、ラベル、型、必須、数式かどうかが確認できる
- [ ] updateable / createable が確認できる
- [ ] フィルタ/検索ができる

## MVP 3: Access Diagnostic
- [ ] 現在ユーザーの情報（User Id, Profile名）が表示される
- [ ] 対象オブジェクトの各項目のFLS（readable/updateable）が確認できる
- [ ] 読めない/編集できない項目の原因候補が提示される

## MVP 4: Test Data Creator
- [ ] sandbox環境でのみ実行可能
- [ ] production環境ではツール自体が非表示またはdisabled
- [ ] 実行前にconfirmダイアログが表示される
- [ ] 必須項目を自動検出して入力フォームに含める
- [ ] 作成されたレコードのIDとリンクが表示される

## MVP 5: UAT Guide
- [ ] pageMatch + objectMatch に応じてガイドが切り替わる
- [ ] Project PackのJSONからガイド文面を読み込める
- [ ] ガイドが存在しない画面では「ガイドなし」表示

## Safety
- [ ] production判定が正しく動作する
- [ ] allowInProd === false のツールがproductionで実行不可
- [ ] write系ツールでconfirmを経ないと実行しない
- [ ] maxAffectedRecords 超過時に拒否される

## Project Pack
- [ ] default packが読み込める
- [ ] manabie packサンプルが存在する
- [ ] Options画面でPack切替が可能
