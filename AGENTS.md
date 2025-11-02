# YouTube Related Hider 指示書

## 概要
- 対象: YouTube (`https://www.youtube.com/*`, `https://m.youtube.com/*`)。
- 目的: ビューポート幅が1000px未満のときに `id="related"` 要素（関連動画カラム）を非表示にする。
- 閾値: 幅が1000px以上に戻ったら関連動画を表示し直す。

## 技術仕様
- `manifest.json` は Manifest V3 を使用し、`content.js` を `document_idle` で注入する。
- `content.js` は以下のロジックを実装:
  - 初期化時および YouTube 内のナビゲーションイベント（`yt-navigate-finish` など）や `MutationObserver` で `related` の存在を検知。
  - 現在の `window.innerWidth` を監視し、1000px未満なら `display: none !important` を適用。
  - 1000px以上に戻った場合は元の `display` スタイルを復元。
  - リサイズや `visibilitychange` イベントでも再判定を行う。

## 動作確認手順
- Chrome の拡張機能ページ (chrome://extensions) でデベロッパーモードを有効化し、本ディレクトリを「パッケージ化されていない拡張機能を読み込む」で追加。
- YouTube を開き、ブラウザ幅を1000px前後で変化させ、関連動画カラムが表示/非表示に切り替わることを確認。

## 運用メモ
- YouTube の DOM 構造変更に備え `MutationObserver` と YouTube 固有のナビゲーションイベントにフックしているが、仕様変更時は `content.js` の監視対象やイベントを調整する。
- 必要に応じて他ページへの影響を避けるため、`matches` 配列にドメインを追加・削除することで対象範囲を調整する。
