# Local AI Provider

SF Mothership の AI 補助ツールは、Gemini Nano / Chrome Prompt API と、明示オプトインの localhost AI サーバーを provider routing で使い分ける。

## セキュリティ境界

- デフォルトでは無効。
- Base URL は `localhost` または `127.0.0.1` のみ許可。
- Service Worker proxy は `/health` と `/v1/chat` のみ許可。
- request size と timeout を設定する。
- `sessionId`、`sid`、`token`、`password`、`authorization` などの secret-like key は送信前に除去する。
- v0.9.0 の `local-ai-provider/` starter も 64KB body limit、path allowlist、secret-like key mask、最小 CORS を持つ。

## 同梱 starter（v0.9.0）

まず mock provider で接続確認する:

```bash
npm run local-ai:mock
```

既定 URL:

```text
http://127.0.0.1:3847
```

Options 画面で Local AI Provider を有効化し、Base URL に上記を設定して `/health` 接続テストを実行する。

Ollama を使う場合:

```bash
ollama pull llama3.2:3b
npm run local-ai:ollama
```

既定 model は `llama3.2:3b`。変更する場合:

```bash
OLLAMA_MODEL=llama3.2:3b OLLAMA_BASE_URL=http://127.0.0.1:11434 npm run local-ai:ollama
```

Ollama が未起動の場合、`POST /v1/chat` は `Ollama is not reachable` を含む error を返す。

## API 仕様

### `GET /health`

期待レスポンス:

```json
{
  "status": "ok",
  "version": "optional"
}
```

`status` が `ok` 以外の場合、SF Mothership は provider を unavailable として扱う。

### `POST /v1/chat`

リクエスト例:

```json
{
  "task": "diagnostic-explain",
  "prompt": "日本語で簡潔に説明してください",
  "context": {
    "orgDomain": "example.lightning.force.com",
    "objectApiName": "Account",
    "recordId": "001...",
    "pageType": "recordPage",
    "isSandbox": true
  },
  "data": {
    "summary": "ユーザー確認済みの最小データ"
  }
}
```

期待レスポンス:

```json
{
  "content": "AI response text",
  "model": "optional model name"
}
```

## 実装候補

- 同梱 `local-ai-provider/` starter（mock / Ollama wrapper）
- Codex App Server 互換 endpoint
- LM Studio local server を薄い wrapper で変換

Ollama / LM Studio をそのまま直接叩くのではなく、SF Mothership の `/health` / `/v1/chat` 仕様に合わせる wrapper を置くと、Chrome拡張側の CORS と安全境界を単純に保てる。

## よくある失敗

- `Base URL は localhost または 127.0.0.1 のみ使えます`: remote host や LAN IP を指定している。
- `Local AI Provider が起動していない`: サーバーが停止している、またはポートが違う。
- `CORS 設定で拒否`: provider 側が `chrome-extension://...` origin を許可していない。
- `/health がエラー`: API path またはレスポンス形式が仕様と違う。
