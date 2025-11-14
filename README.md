# YouTube Related Hider

YouTube の関連動画カラム (`id="related"`) の実幅が 420px を超えたら自動的に非表示にし、元の幅に収まったら再表示する Chrome 拡張機能です。さらに右カラム内に開閉ボタンを表示して、ユーザーが任意に関連動画を開閉できます（デフォルトは閉じる＝非表示）。

## 特徴
- YouTube (`https://www.youtube.com/*`, `https://m.youtube.com/*`) を対象に `content.js` を注入。
- `#related` の実幅を `getBoundingClientRect()` で計測し、420px 以上なら `display: none !important` で非表示、未満なら復元。
- 元の `display` スタイルと `!important` 優先度を保持し、表示復帰の際に正しく戻します。
- `#related` の直前にトグルスペースを挿入し、ボタン操作で任意に開閉できる UI を提供します（デフォルトは閉じる）。

## セットアップ
1. Chrome で `chrome://extensions` を開く。
2. 右上の「デベロッパーモード」をオンにする。
3. 「パッケージ化されていない拡張機能を読み込む」からこのディレクトリを選択。

## 動作確認
- YouTube の任意の動画ページを開き、ブラウザ幅を調整して関連動画カラムの実幅が 420px をまたぐ状況を作る。
- カラム幅が 420px 以上で自動的に非表示になり、未満に戻ると表示が復元されることを確認。
- 右カラム内に表示されるトグルボタンで、幅に関係なく任意に関連動画を開閉できることを確認。

## 開発ノート
- YouTube の DOM が変更されると `content.js` の監視対象を調整する必要があります。
- 監視イベントは `yt-navigate-finish` などの SPA イベントと `MutationObserver` を併用しており、必要に応じて追加・更新してください。

