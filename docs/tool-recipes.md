# ツールレシピ集

よくあるパターンのJSON定義例。コピーして `tools.json` に追加するだけで動きます。

---

## 1. レコード基本情報表示

現在のレコードのName, 作成日, 更新日, 所有者を表示。

```json
{
  "id": "record-basic-info",
  "title": "レコード基本情報",
  "description": "現在レコードの基本項目を表示",
  "category": "viewer",
  "pageMatch": ["recordPage"],
  "objectMatch": ["*"],
  "inputs": [],
  "dataSources": ["soql"],
  "operations": [
    {
      "type": "query",
      "stepId": "rec",
      "soql": "SELECT Id, Name, CreatedDate, LastModifiedDate, Owner.Name FROM {{context.objectApiName}} WHERE Id = '{{context.recordId}}'"
    }
  ],
  "output": {
    "type": "card",
    "mapping": {
      "type": "card",
      "title": "{{steps.rec.records.0.Name | default:レコード情報}}",
      "sections": [
        {
          "heading": "基本情報",
          "sourceStepId": "rec",
          "items": [
            { "label": "ID", "value": "{{steps.rec.records.0.Id}}" },
            { "label": "Name", "value": "{{steps.rec.records.0.Name | default:(なし)}}" },
            { "label": "作成日", "value": "{{steps.rec.records.0.CreatedDate | formatDate}}" },
            { "label": "更新日", "value": "{{steps.rec.records.0.LastModifiedDate | formatDate}}" },
            { "label": "所有者", "value": "{{steps.rec.records.0.Owner.Name | default:(不明)}}" }
          ]
        }
      ]
    }
  },
  "safety": { "level": "readOnly", "allowInProd": true, "requireConfirm": false, "maxAffectedRecords": 0, "dryRunSupported": false },
  "projectTags": ["default"],
  "enabled": true
}
```

---

## 2. 全項目一覧テーブル

Describe APIから全項目をテーブル表示。

```json
{
  "id": "all-fields-table",
  "title": "全項目一覧",
  "description": "オブジェクトの全項目をAPI名・型・属性付きで表示",
  "category": "viewer",
  "pageMatch": ["recordPage", "objectHome"],
  "objectMatch": ["*"],
  "inputs": [],
  "dataSources": ["describe"],
  "operations": [
    { "type": "describe", "stepId": "desc" }
  ],
  "output": {
    "type": "table",
    "mapping": {
      "type": "table",
      "sourceStepId": "desc",
      "rowsPath": "fields",
      "columns": [
        { "key": "label", "label": "ラベル", "value": "{{row.label}}", "sortable": true },
        { "key": "api", "label": "API名", "value": "{{row.name}}", "sortable": true },
        { "key": "type", "label": "型", "value": "{{row.type}}", "sortable": true },
        { "key": "req", "label": "必須", "value": "{{row.nillable | negate | yesNo}}", "sortable": true },
        { "key": "upd", "label": "編集可", "value": "{{row.updateable | yesNo}}", "sortable": true },
        { "key": "formula", "label": "数式", "value": "{{row.calculatedFormula | notNull | yesNo}}", "sortable": true }
      ]
    }
  },
  "safety": { "level": "readOnly", "allowInProd": true, "requireConfirm": false, "maxAffectedRecords": 0, "dryRunSupported": false },
  "projectTags": ["default"],
  "enabled": true
}
```

---

## 3. カスタム項目のみテーブル（transform使用）

Describeの結果をフィルタしてカスタム項目だけ表示。

```json
{
  "id": "custom-fields-only",
  "title": "カスタム項目のみ",
  "description": "カスタム項目(__c)だけを抽出して表示",
  "category": "viewer",
  "pageMatch": ["recordPage", "objectHome"],
  "objectMatch": ["*"],
  "inputs": [],
  "dataSources": ["describe"],
  "operations": [
    { "type": "describe", "stepId": "desc" },
    {
      "type": "transform",
      "stepId": "customOnly",
      "sourceStepId": "desc",
      "sourcePath": "fields",
      "filter": "{{row.custom | yesNo}}"
    }
  ],
  "output": {
    "type": "table",
    "mapping": {
      "type": "table",
      "sourceStepId": "customOnly",
      "rowsPath": "",
      "columns": [
        { "key": "label", "label": "ラベル", "value": "{{row.label}}", "sortable": true },
        { "key": "api", "label": "API名", "value": "{{row.name}}", "sortable": true },
        { "key": "type", "label": "型", "value": "{{row.type}}", "sortable": true }
      ]
    }
  },
  "safety": { "level": "readOnly", "allowInProd": true, "requireConfirm": false, "maxAffectedRecords": 0, "dryRunSupported": false },
  "projectTags": ["default"],
  "enabled": true
}
```

> **注意**: transformの結果は配列そのものなので、`rowsPath` は空文字列 `""` を指定。

---

## 4. 関連レコード件数（forEach使用）

Describeの子リレーション情報から、各関連オブジェクトの件数をカウント。

```json
{
  "id": "related-record-counts",
  "title": "関連レコード件数",
  "description": "このレコードに紐付く関連オブジェクトの件数",
  "category": "viewer",
  "pageMatch": ["recordPage"],
  "objectMatch": ["*"],
  "inputs": [],
  "dataSources": ["describe", "soql"],
  "operations": [
    { "type": "describe", "stepId": "desc" },
    {
      "type": "forEach",
      "stepId": "counts",
      "sourceStepId": "desc",
      "sourcePath": "childRelationships",
      "filter": "{{row.relationshipName | notNull}}",
      "limit": 5,
      "soql": "SELECT COUNT() FROM {{row.childSObject}} WHERE {{row.field}} = '{{context.recordId}}'"
    }
  ],
  "output": {
    "type": "card",
    "mapping": {
      "type": "card",
      "title": "関連レコード件数",
      "sections": [
        {
          "heading": "上位5リレーション",
          "sourceStepId": "counts",
          "items": []
        }
      ]
    }
  },
  "safety": { "level": "readOnly", "allowInProd": true, "requireConfirm": false, "maxAffectedRecords": 0, "dryRunSupported": false },
  "projectTags": ["default"],
  "enabled": true
}
```

> **注意**: forEach結果のカード表示マッピングは現在制限あり。items配列にテンプレートで動的にマッピングする機能は将来追加予定。

---

## 5. UATガイド定義

Pack の `guides.json` にガイド内容を定義：

```json
{
  "guides": [
    {
      "id": "account-record-guide",
      "pageMatch": ["recordPage"],
      "objectMatch": ["Account"],
      "title": "取引先レコード確認ポイント",
      "sections": [
        {
          "heading": "基本確認",
          "items": [
            "会社名が正式名称で入力されているか",
            "業種・従業員数が設定されているか",
            "所有者が正しい営業担当になっているか"
          ]
        },
        {
          "heading": "住所情報",
          "items": [
            "請求先住所と納入先住所が正しいか",
            "郵便番号の形式が正しいか"
          ]
        }
      ]
    }
  ]
}
```

ツール側の定義（UAT Guide builtin）は既にデフォルトで含まれています。
ガイドの追加はPack の `guides.json` に追記するだけです。

---

## ツール追加の手順

1. `src/packs/{packId}/tools.json` の `"tools"` 配列にJSON定義を追加
2. `npm run build` でビルド
3. Chrome拡張を再読み込み
4. Salesforceページを開いてSide Panelで確認
