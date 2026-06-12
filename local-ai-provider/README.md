# Local AI Provider Starter

SF Mothership と Chrome AI Kit から使える、localhost 専用の最小 AI provider です。

Node.js 標準 API だけで動き、まずは mock provider で接続確認できます。Ollama を起動すると無料ローカル LLM へ切り替えられます。

## 起動

```bash
npm run local-ai:mock
```

既定 URL:

```text
http://127.0.0.1:3847
```

SF Mothership の Options で Local AI Provider を有効化し、Base URL に上記を設定して接続テストを実行してください。

## Ollama を使う

1. Ollama をインストールします。
2. モデルを取得します。

```bash
ollama pull llama3.2:3b
```

3. provider を Ollama mode で起動します。

```bash
npm run local-ai:ollama
```

環境変数で model / URL を変更できます。

```bash
OLLAMA_MODEL=llama3.2:3b OLLAMA_BASE_URL=http://127.0.0.1:11434 npm run local-ai:ollama
```

Ollama が起動していない場合、`POST /v1/chat` は `Ollama is not reachable` を含む error を返します。

## API

### `GET /health`

```json
{
  "status": "ok",
  "provider": "mock",
  "version": "0.1.0"
}
```

### `POST /v1/chat`

```json
{
  "task": "diagnostic-explain",
  "prompt": "日本語で簡潔に説明してください",
  "context": {
    "objectApiName": "Account"
  },
  "data": {
    "summary": "safe minimal data"
  }
}
```

レスポンス:

```json
{
  "content": "AI response text",
  "model": "mock-local-ai"
}
```

## Safety

- bind 先は `127.0.0.1` のみです。
- 許可 path は `GET /health` と `POST /v1/chat` のみです。
- request body は 64KB を超えると 413 で拒否します。
- `sessionId` / `sid` / `token` / `authorization` / `cookie` などの secret-like key は provider 側でも `[removed]` に mask します。
- CORS は `chrome-extension://` / `localhost` / `127.0.0.1` origin のみ反射し、`*` は返しません。

## Test

```bash
node --test local-ai-provider/src/*.test.mjs
```
