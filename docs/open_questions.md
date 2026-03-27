# Open Questions

ChatGPTとの検討で残った論点と、推奨判断方針。

## 1. Salesforce API呼び出しの最終方式

**論点**: Content Script経由か、Service Worker経由か。

**推奨**: Service Worker経由。
- Content ScriptからはCORSの制約を受ける
- Service Workerはhost_permissionsで*.salesforce.com, *.force.comに対して自由にfetch可能
- Content Script → chrome.runtime.sendMessage → Service Worker → fetch → 結果返却

## 2. recordId / objectApiName の取得精度

**論点**: URLだけで十分か、DOM補助が必要か。

**推奨**: URLパース優先、DOM補助は最小限。
- Lightning URL: `/lightning/r/{ObjectApiName}/{RecordId}/view` で確実に取れる
- Setup画面: MVPでは対応しない
- DOM解析が必要なケース（タブ内のrelatedリスト等）は将来Phase

## 3. Project Pack の読み込み方法

**論点**: 拡張同梱JSONのみか、外部読み込みか。

**推奨**: MVPでは拡張同梱JSONのみ。
- `src/packs/default/` と `src/packs/manabie/` をビルド時にdist/に含める
- Options画面でactivePack切替（chrome.storage.localに保存）
- 将来: URL指定で外部JSONを読む機能を追加

## 4. Tool Definitionの粒度

**論点**: MVPではどこまで宣言化するか。

**推奨**: 構造は定義、ロジックはコード。
- id, title, category, pageMatch, objectMatch, inputs, safety → JSON定義
- operations → `{ type: "builtin", handler: "functionName" }` でコード側に委譲
- output → type指定のみ。レンダリングはコード側
- 将来: operationsにSOQLテンプレートを書けるようにする

## 5. UAT guide のデータ構造

**論点**: どの粒度でガイドをマッチさせるか。

**推奨**: pageMatch + objectMatch + 任意のrecordTypeMatch。
- `docs/sample_manabie_guides.json` 参照
- recordTypeMatchはoptional（指定なしなら全レコードタイプにマッチ）
- ガイドが複数マッチした場合は全て表示

## 6. org種別（sandbox/production）の判定

**論点**: ドメインで判定するか、APIで判定するか。

**推奨**: 両方併用。
- 一次判定: ドメインに `--sandbox` や `.sandbox.` が含まれればsandbox
- 二次判定: REST API `SELECT IsSandbox FROM Organization` で確認
- キャッシュ: 判定結果をchrome.storage.localに保存（org domain単位）

## 7. ログ保存

**論点**: どこに、どれだけ保存するか。

**推奨**: MVPではchrome.storage.localに直近20件。
- ツール実行ログ: { timestamp, toolId, orgDomain, success, duration }
- セッションIDや個人データは絶対にログに含めない
- 将来: Options画面からエクスポート機能

## 8. 最初の対象オブジェクト

**論点**: 汎用オブジェクトから始めるか、Manabie固有から始めるか。

**推奨**: Account / Contact で汎用動作を確認後、Manabie Pack で MANAERP__ オブジェクトを検証。
- objectMatch: ["*"] で全オブジェクト対応が基本
- Manabie PackのUATガイドでManabie固有の動作を検証
