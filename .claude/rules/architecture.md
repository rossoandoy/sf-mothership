# Architecture Rules

## レイヤー境界

- `api/` は Salesforce API通信のみ。UI依存禁止
- `context/` はページ文脈の解析のみ。API呼び出し禁止
- `runtime/` はツール実行エンジン。特定ツールのロジック禁止
- `tools/builtins/` はToolDefinition型を実装する。api/やcontext/を直接importしてよい
- `sidepanel/` はReactコンポーネントのみ。ビジネスロジック禁止（runtimeに委譲）

## メッセージパッシング

- Content Script → Service Worker: chrome.runtime.sendMessage
- Side Panel → Service Worker: chrome.runtime.sendMessage
- Service Worker → Content Script: chrome.tabs.sendMessage
- API呼び出しはService Worker内でのみ実行する

## ツール追加パターン

新しいbuiltinツールを追加するとき:
1. `types/tool.ts` のToolDefinition型に準拠した定義を書く
2. `tools/builtins/` にhandlerを実装する
3. `runtime/toolRegistry.ts` にregistrationを追加する
4. 対応するProject Packのtools.jsonにも定義を追加する

## エラーハンドリング

- API呼び出しは必ずtry-catchで囲む
- Result型 `{ok: true, data: T} | {ok: false, error: string}` を返す
- UIレイヤーでerror stateを表示する
- 認証エラー（401/403）は専用メッセージを出す

## 状態管理

- グローバル状態はchrome.storage.localに永続化
- React内の状態はuseState/useReducerで管理
- ツール実行結果はSide Panel内のローカル状態で保持（永続化不要）
