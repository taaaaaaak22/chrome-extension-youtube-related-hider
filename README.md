# YouTube Related Hider

YouTube の画面幅が 1000px 未満になったときに、関連動画カラム (`id="related"`) を自動的に非表示にする Chrome 拡張機能です。1000px 以上に戻ると関連動画は再表示されます。

## 特徴
- YouTube (`https://www.youtube.com/*`, `https://m.youtube.com/*`) を対象に `content.js` を注入。
- 画面幅の監視と YouTube 固有のナビゲーションイベントをフックし、関連動画要素の表示状態を動的に切り替えます。
- 元の `display` スタイルを保持し、表示復帰の際に正しく戻します。

## セットアップ
1. Chrome で `chrome://extensions` を開く。
2. 右上の「デベロッパーモード」をオンにする。
3. 「パッケージ化されていない拡張機能を読み込む」からこのディレクトリを選択。

## 動作確認
- YouTube の任意の動画ページを開き、ブラウザの幅を 1000px 前後で行き来させる。
- 幅が 1000px 未満のときに関連動画カラムが非表示になり、1000px 以上で再表示されることを確認。

## 開発ノート
- YouTube の DOM が変更されると `content.js` の監視対象を調整する必要があります。
- 監視イベントは `yt-navigate-finish` などの SPA イベントと `MutationObserver` を併用しており、必要に応じて追加・更新してください。
