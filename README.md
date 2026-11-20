# Test Notice BOT
岐阜高専1Dの学生のためのテストやスケジュールをお知らせするためのbotです。
誰かの役に立つかもしれないのでOSS化しています

## 要求
- Node.js
- 常時実行できるPC環境 (Ubuntu Server 24.0.3 LTSにて動作確認済）

## Installation
### Discordで実行したい（推奨）
1. `.env`を作成し、設定
2. レポジトリのルートディレクトリで以下のコマンドを実行

```zsh
$ npm run discord
```

### LINEで送信したい（非推奨、バグあり@1.2.0）
1. `.env`を作成し、設定
2. レポジトリのルートディレクトリで以下のコマンドを実行

```zsh
$ npm run send
```

## `.env`の設定
|項目|内容|
|-|-|
|`LINE_ACCESS_TOKEN`|LINEのトークン（`send-msg.js`使用時のみ）|
|`LINE_GROUP_ID`|LINEのGroup ID（`send-msg.js`使用時のみ）|
|`DISCORD_TOKEN`|DiscordBOTのトークン（`discord.js`使用時のみ）|
|`GUILD_ID`|DiscordのギルドID（`discord.js`使用時のみ）|
|`CLIENT_ID`|DiscordのクライアントID（`discord.js`使用時のみ）|
|`CHANNEL_ID`|テストの通知を受け取るチャンネル（`discord.js`使用時のみ）|
|`OPERATION_USERID`|予定が未登録・取得失敗のときにメンションする運用者（`discord.js`使用時のみ）|
|`API_ENDPOINT`|test-notice-api v2 のURL（省略時は本番 `https://test-notice-worker.sora81dev.workers.dev/api/v2`）|

## LICENCE
Copyright (c) 2025 sora81dev, gnct25s All Rights Reserved.
