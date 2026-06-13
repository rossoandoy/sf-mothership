# Safety Rules

## Production環境での制御

- production判定は `api/client.ts` のisSandbox()で行う
- production環境ではsafety.allowInProd === falseのツールをregistryから除外する
- write操作は必ずSafetyGuardを通す

## Write操作の制御フロー

1. ユーザーがwrite系ツールを実行
2. SafetyGuardがproduction判定を実行
3. productionかつallowInProd === falseなら拒否
4. dryRunSupportedならプレビューを先に表示
5. requireConfirmならconfirmダイアログを表示
6. maxAffectedRecordsを超えないか検証
7. 実行後、結果を表示

## 絶対にやってはいけないこと

- production環境でのbulk delete
- confirmなしのrecord create/update
- ユーザー入力を直接SOQLに連結（インジェクション防止）
- セッションIDのログ出力やconsole.log
- UI側へsessionIdを返す新規実装（Salesforce APIはService Worker proxy経由に統一）
- 外部サーバーへのデータ送信（Salesforceサーバー以外への通信禁止）
- 例外: localhost の Local AI Provider は Options でユーザーが明示オプトインした場合のみ
- Local AI Provider 送信時は sessionId / token 等の機密情報を含めない（`appServerSafety.ts`）

## Proxy境界

- Salesforce API proxy はService Worker内でcookie/sessionIdを扱い、UIへはResult互換のAPI結果だけ返す
- Local AI Provider proxy はlocalhost AI連携専用で、`/health` と `/v1/chat` のみ許可する
- Salesforce API proxy と Local AI Provider proxy のmessage typeと責務を混同しない
