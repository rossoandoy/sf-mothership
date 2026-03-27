# ツール作成ガイド

SF Mothershipでは、JSONファイルだけで新しいSalesforceツールを定義できます。
TypeScriptコードの記述やビルドの知識は不要です。

## 基本構造

```json
{
  "id": "my-tool-id",
  "title": "ツール表示名",
  "description": "説明文",
  "category": "viewer",
  "pageMatch": ["recordPage"],
  "objectMatch": ["*"],
  "inputs": [],
  "dataSources": ["soql"],
  "operations": [
    { "type": "query", "stepId": "data", "soql": "SELECT ..." }
  ],
  "output": {
    "type": "card",
    "mapping": { ... }
  },
  "safety": {
    "level": "readOnly",
    "allowInProd": true,
    "requireConfirm": false,
    "maxAffectedRecords": 0,
    "dryRunSupported": false
  },
  "projectTags": ["default"],
  "enabled": true
}
```

## フィールド説明

### 基本
| フィールド | 型 | 説明 |
|-----------|---|------|
| `id` | string | 一意のID（kebab-case） |
| `title` | string | Side Panelに表示されるツール名 |
| `description` | string | ツールの説明文 |
| `category` | `"viewer"` / `"diagnostic"` / `"action"` / `"guide"` | カテゴリ |
| `pageMatch` | string[] | 表示する画面種別: `"recordPage"`, `"objectHome"`, `"setupPage"` |
| `objectMatch` | string[] | 対象オブジェクト。`["*"]` で全オブジェクト |
| `enabled` | boolean | `false` で無効化 |

### 安全設定 (safety)
| フィールド | 説明 |
|-----------|------|
| `level` | `"readOnly"` / `"lowRiskWrite"` / `"highRiskWrite"` |
| `allowInProd` | Production環境で使用可能か |
| `requireConfirm` | 実行前に確認ダイアログを表示するか |
| `maxAffectedRecords` | 影響レコード上限（0=無制限） |
| `dryRunSupported` | DryRunプレビュー対応か |

## Operation（データ取得）

### query — SOQLクエリ
```json
{
  "type": "query",
  "stepId": "records",
  "soql": "SELECT Id, Name FROM {{context.objectApiName}} WHERE Id = '{{context.recordId}}'"
}
```

### describe — オブジェクトメタデータ
```json
{
  "type": "describe",
  "stepId": "meta"
}
```
省略時は現在のオブジェクトのDescribeを取得。`objectApiName`で明示指定も可能。

### userInfo — 現在ユーザー情報
```json
{
  "type": "userInfo",
  "stepId": "user"
}
```

### staticData — 静的データ
```json
{
  "type": "staticData",
  "stepId": "config",
  "data": { "key": "value" }
}
```

### transform — 前ステップの結果を変換
```json
{
  "type": "transform",
  "stepId": "customFields",
  "sourceStepId": "meta",
  "sourcePath": "fields",
  "filter": "{{row.custom | yesNo}}",
  "limit": 50
}
```

### forEach — 配列の各要素にクエリ実行
```json
{
  "type": "forEach",
  "stepId": "relatedCounts",
  "sourceStepId": "meta",
  "sourcePath": "childRelationships",
  "filter": "{{row.relationshipName | notNull}}",
  "limit": 5,
  "soql": "SELECT COUNT() FROM {{row.childSObject}} WHERE {{row.field}} = '{{context.recordId}}'"
}
```

### createRecord — レコード作成（write操作）
```json
{
  "type": "createRecord",
  "stepId": "created",
  "fields": {
    "Name": "{{inputs.recordName}}",
    "Description": "テストデータ"
  }
}
```

## テンプレート式

`{{...}}` 内で変数参照とフィルタが使えます。

### 変数スコープ
| プレフィックス | 説明 | 例 |
|---------------|------|---|
| `context.*` | ページコンテキスト | `{{context.objectApiName}}`, `{{context.recordId}}` |
| `inputs.*` | ユーザー入力 | `{{inputs.recordName}}` |
| `steps.<id>.*` | 前ステップの結果 | `{{steps.records.records.0.Name}}` |
| `row.*` | テーブル行/forEach要素 | `{{row.label}}`, `{{row.name}}` |

### パイプフィルタ
| フィルタ | 説明 | 例 |
|---------|------|---|
| `default:値` | null/空なら代替値 | `{{row.Name \| default:(なし)}}` |
| `formatDate` | 日本語日時形式 | `{{row.CreatedDate \| formatDate}}` |
| `yesNo` | true→Yes, false→空 | `{{row.updateable \| yesNo}}` |
| `negate` | 真偽値反転 | `{{row.nillable \| negate}}` |
| `count` | 配列の件数 | `{{steps.meta.fields \| count}}` |
| `truncate:N` | N文字で切り詰め | `{{row.description \| truncate:30}}` |
| `join:区切り` | 配列を結合 | `{{row.referenceTo \| join:,}}` |
| `notNull` | 非null判定 | `{{row.relationshipName \| notNull}}` |
| `slice:start:end` | 配列スライス | `{{steps.list \| slice:0:10}}` |

## Output Mapping（表示形式）

### card — カード表示
```json
{
  "type": "card",
  "mapping": {
    "type": "card",
    "title": "{{steps.records.records.0.Name}}",
    "sections": [
      {
        "heading": "基本情報",
        "sourceStepId": "records",
        "items": [
          { "label": "ID", "value": "{{steps.records.records.0.Id}}" },
          { "label": "名前", "value": "{{steps.records.records.0.Name}}" }
        ]
      }
    ]
  }
}
```

### table — テーブル表示
```json
{
  "type": "table",
  "mapping": {
    "type": "table",
    "sourceStepId": "meta",
    "rowsPath": "fields",
    "columns": [
      { "key": "label", "label": "ラベル", "value": "{{row.label}}", "sortable": true },
      { "key": "apiName", "label": "API名", "value": "{{row.name}}", "sortable": true }
    ]
  }
}
```

### guidePanel — ガイド表示
```json
{
  "type": "guidePanel",
  "mapping": {
    "type": "guidePanel",
    "title": "確認ポイント",
    "sourceStepId": "guideData",
    "sectionsPath": "sections"
  }
}
```

## ユーザー入力 (inputs)

```json
"inputs": [
  {
    "id": "searchTerm",
    "label": "検索キーワード",
    "type": "text",
    "required": false,
    "defaultValue": "",
    "helpText": "項目名で絞り込み"
  },
  {
    "id": "count",
    "label": "件数",
    "type": "number",
    "required": false,
    "defaultValue": "5",
    "helpText": "1〜10"
  }
]
```
入力型: `"text"`, `"number"`, `"select"`, `"checkbox"`

## Pack にツールを追加する

`src/packs/{packId}/tools.json` にツール定義を追加:

```json
{
  "tools": [
    { ... ツール定義1 ... },
    { ... ツール定義2 ... }
  ]
}
```

Pack切替はOptions画面から。

## SOQL安全ルール

- `context.recordId` → 15/18桁英数字のみ許可（自動検証）
- `context.objectApiName` → API名形式のみ許可（自動検証）
- `inputs.*` → シングルクォートが自動エスケープ（SOQLインジェクション防止）
- ユーザー入力を直接SOQLに連結しない — 必ずテンプレート式を経由する
