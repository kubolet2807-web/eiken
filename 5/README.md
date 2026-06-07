# 英検5級 学習アプリ

中学1年生向けの英検5級対策用ローカル学習アプリです。

## 起動方法

Windowsで `start.bat` をダブルクリックしてください。

または、`index.html` をブラウザで開いても動作します。

## ファイル構成

- `index.html`: 画面の骨組み
- `styles.css`: 見た目
- `questions.js`: 問題データ
- `app.js`: アプリの動作
- `start.bat`: Windows用の起動ファイル

## 保存データ

学習記録と復習リストは、ブラウザの `localStorage` に保存されます。
同じPC、同じブラウザで開くと記録が残ります。
