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
- 外部サーバーへのデータ送信（Salesforceサーバー以外への通信禁止）
