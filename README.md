# Test Notice BOT
岐阜高専1Dの学生のためのテストやスケジュールをお知らせするためのbotです。
誰かの役に立つかもしれないのでOSS化しています

## 要求
- Node.js
- 常時実行できるPC環境 (Ubuntu Server 24.0.3 LTSにて動作確認済）

## Installation
### Discord
1. `.env`を作成し、設定
2. レポジトリのルートディレクトリで以下のコマンドを実行

```zsh
$ npm run discord
```

## `.env`の設定
|項目|内容|
|-|-|
|`DISCORD_TOKEN`|DiscordBOTのトークン|
|`GUILD_ID`|DiscordのギルドID|
|`CLIENT_ID`|DiscordのクライアントID|
|`CHANNEL_ID`|テストの通知を受け取るチャンネル|
|`OPERATION_USERID`|予定が未登録・取得失敗のときにメンションする運用者|
|`API_ENDPOINT`|test-notice-api v2 のURL（省略時は本番 `https://test-notice-worker.sora81dev.workers.dev/api/v2`）|

通知の時刻（日〜木 16:15 に翌日分）や `/print` 系コマンドの「今日・明日」は、実行環境のタイムゾーンに関係なく **JST** で計算します。

## LICENCE
Copyright (c) 2025 sora81dev, gnct25s All Rights Reserved.
