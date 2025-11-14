# YouTube Related Hider 指示書

## 概要
- 対象: YouTube (`https://www.youtube.com/*`, `https://m.youtube.com/*`)。
- 目的: `id="related"` 要素（関連動画カラム）の実幅が 420px 以上になったら非表示にし、420px 未満になったら表示を復元しつつ、ユーザーが任意で開閉できるトグルボタンを提供する。
- 閾値: 関連動画カラムの幅が `MAX_RELATED_WIDTH_TO_SHOW = 420` を境に表示/非表示を切り替えるが、トグル操作時はユーザー指定を優先する（デフォルトは非表示）。

## 技術仕様
- `manifest.json` は Manifest V3 を使用し、`content.js` を `document_idle` で注入する。
- `content.js` は以下のロジックを実装:
  - 初期化時および YouTube 内のナビゲーションイベント（`yt-navigate-finish` など）や `MutationObserver` で `related` の存在を検知。
  - `getBoundingClientRect()` で `related` の実幅を計測し、420px 以上なら `display: none !important` を適用。
  - 非表示にする際は元の `display` 値と `!important` 優先度を `data-*` に退避し、表示に戻すときに復元。
  - `related` 要素と同じカラム内（`#related` の直前）にトグルボタン用のスペース (`#yt-related-toggle-wrapper`) を挿入し、そこに `#yt-related-toggle` ボタンを配置して開閉を切り替える（初期状態は閉じる＝非表示）。
  - リサイズや `visibilitychange` イベントでも再判定を行う。

## 動作確認手順
- Chrome の拡張機能ページ (chrome://extensions) でデベロッパーモードを有効化し、本ディレクトリを「パッケージ化されていない拡張機能を読み込む」で追加。
- YouTube を開き、関連動画カラムの幅が 420px を境に表示/非表示が切り替わること、およびトグルボタンで任意に開閉できることを確認。

## 運用メモ
- YouTube の DOM 構造変更に備え `MutationObserver` と YouTube 固有のナビゲーションイベントにフックしているが、仕様変更時は `content.js` の監視対象やイベントを調整する。
- 必要に応じて他ページへの影響を避けるため、`matches` 配列にドメインを追加・削除することで対象範囲を調整する。
