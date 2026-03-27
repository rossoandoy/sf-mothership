# Project Handoff

## 1. このプロジェクトは何か

Salesforce Inspector Reloaded方式の発想を活用し、Salesforce導入現場で発生する細かな面倒ごとを、その場で使える小ツールとして素早く提供するためのChrome拡張母艦を構築する。

単発の便利ツールを1本作るのではなく、案件ごとに異なる小さな面倒を、共通基盤の上で量産できることが本質。

## 2. 技術的な背景: SIRの仕組み

Salesforce Inspector Reloadedが50,000+ユーザーを獲得した核心技術:

- **セッション再利用**: ブラウザCookieのsidを`chrome.cookies` APIで取得 → REST APIのBearer tokenとして使用
- **追加ログイン不要**: ユーザーがSalesforceにログイン済みなら即座にAPIアクセス可能
- **ページコンテキスト**: Content ScriptがURL・DOMを解析し、現在のオブジェクト/レコードIDを特定
- **直接通信**: ブラウザ → Salesforceサーバー。第三者にデータは送られない

この仕組みをそのまま導入支援ツールの基盤に転用する。

## 3. アーキテクチャ

### 4層構造

```
┌─────────────────────────────────────────────────┐
│ D. Project Pack Layer                            │
│    案件別ツール定義JSON / ガイド文面 / 設定       │
├─────────────────────────────────────────────────┤
│ C. Tool Runtime Layer                            │
│    PageContext → Registry → Executor → Renderer  │
│    SafetyGuard                                   │
├─────────────────────────────────────────────────┤
│ B. Salesforce Access Layer                       │
│    REST API / Tooling API / Describe / Write     │
│    Session管理 / エラー標準化                     │
├─────────────────────────────────────────────────┤
│ A. Chrome Extension Layer                        │
│    Manifest V3 / Service Worker / Content Script │
│    Side Panel / Popup / Options                  │
└─────────────────────────────────────────────────┘
```

### 主要コンポーネント

**Org Context Resolver** — 現在のタブから取得:
- org domain, object API name, record id
- page type (recordPage / objectHome / setupPage / other)
- is lightning, is sandbox

**Salesforce Access Layer** — 認証済みセッションでAPI実行:
- REST client (SOQL, sObject CRUD)
- Tooling client (Flow/ValidationRule取得)
- Describe client (オブジェクト/項目メタデータ)
- Write client (SafetyGuard経由のみ)

**Tool Registry** — 文脈に合うツールを返す:
- pageMatch / objectMatch でフィルタリング
- Project Packごとの絞り込み
- safety.allowInProdによるproduction制御

**Tool Runtime** — ツール定義を解釈して実行:
- 入力フォーム生成
- 文脈変数の注入 (`{{context.recordId}}` 等)
- Query / Action実行
- 結果表示

**Safe Action Guard** — 書き込みの事故防止:
- production判定
- confirm必須化
- 件数上限チェック
- dry run / preview

## 4. MVP 5本

| # | ツール名 | カテゴリ | 安全レベル | 概要 |
|---|---------|---------|-----------|------|
| 1 | Quick Record Viewer | viewer | readOnly | 現在レコードの基本情報 + 関連リスト件数 |
| 2 | Field Context Inspector | viewer | readOnly | 画面上の項目のAPI名・型・属性一覧 |
| 3 | Access Diagnostic | diagnostic | readOnly | 権限・表示差異の原因候補表示 |
| 4 | Test Data Creator | action | lowRiskWrite | Sandbox限定のテストデータ作成 |
| 5 | UAT Guide | guide | readOnly | 画面ごとのガイド・確認ポイント表示 |

## 5. Tool Definition スキーマ

```typescript
interface ToolDefinition {
  id: string;                    // kebab-case
  title: string;                 // 表示名
  description: string;           // 説明文
  category: 'viewer' | 'diagnostic' | 'action' | 'guide';
  pageMatch: PageType[];         // どの画面で表示するか
  objectMatch: string[];         // 対象オブジェクト（'*' = 全て）
  inputs: InputDefinition[];     // ユーザー入力定義
  dataSources: DataSource[];     // 利用するデータソース
  operations: Operation[];       // 実行内容
  output: OutputDefinition;      // 表示形式
  safety: SafetyDefinition;      // 安全制御
  projectTags: string[];         // 案件識別タグ
  enabled: boolean;              // 有効/無効
}

interface SafetyDefinition {
  level: 'readOnly' | 'lowRiskWrite' | 'highRiskWrite';
  allowInProd: boolean;
  requireConfirm: boolean;
  maxAffectedRecords: number;    // 0 = 制限なし
  dryRunSupported: boolean;
}
```

## 6. Open Questions（Claude Codeの実装判断に委ねる）

| # | 論点 | 推奨方針 |
|---|------|---------|
| 1 | API呼び出しの経路 | Service Worker経由を推奨（Content Script → message → SW → API） |
| 2 | recordId取得精度 | URLパース優先。DOMは最後の手段。Setup画面はMVPでは非対応 |
| 3 | Pack読み込み方式 | MVPでは拡張同梱JSONのみ。Options画面でPack切替 |
| 4 | Tool Definitionの粒度 | MVPではoperationsはbuiltin handler名のみ。SOQL文の宣言化は後回し |
| 5 | UAT guideデータ構造 | pageMatch + objectMatchの組合せでガイドJSONをルックアップ |
| 6 | org種別判定 | REST API `/services/data/vXX.0/query/?q=SELECT+IsSandbox+FROM+Organization` |
| 7 | ログ保存 | MVPではchrome.storage.localに直近20件のみ |
| 8 | 最初の対象オブジェクト | Account / Contact で汎用動作を確認後、MANAERP__オブジェクトで検証 |

## 7. 実装フェーズ

```
Phase 1: 拡張骨組み
  → Manifest V3 + Service Worker + Side Panel + Content Script + React

Phase 2: Salesforce文脈取得
  → URL parser + org domain + object API name + record id + page type

Phase 3: APIクライアント
  → cookie取得 + REST client + Tooling client + Describe + エラーハンドリング

Phase 4: Tool Registry / Runtime
  → ToolDefinition型 + registry + context matching + action executor

Phase 5: MVP実装
  → 5本のbuiltinツール

Phase 6: Safety / Pack
  → production判定 + write confirm + project pack読み込み

Phase 7: 仕上げ
  → エラー表示改善 + README + 制約ドキュメント化
```

## 8. Manabie ERP固有情報

Manabie ERPは MANAERP__ 名前空間で276オブジェクト・2,554項目を持つ。
主要ドメイン: Billing, Lesson, Exam, Staff, Access Control, Academic Calendar

Manabie Pack（packs/manabie/）には以下を含める:
- focusObjects: MANAERP__Student__c, MANAERP__Bill_Item__c, MANAERP__Lesson_Slot__c 等
- UAT guideのManabie固有ガイド文面
- 命名規則チェック設定

## 9. 既存ワークストリームとの接続

- **DevOps Center × Claude Code Action**: Gitベースのメタデータ管理パイプライン。Chrome拡張はリアルタイム検証の補完
- **Manabie ERPレポート支援**: スキーマ情報（265オブジェクト定義）の共有基盤
- 共通のデータモデル定義がproject-config / CLAUDE.mdとして機能する
