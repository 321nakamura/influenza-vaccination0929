# Googleスプレッドシート連携版 セットアップ手順（最短）

## 構成
- index.html … フォーム本体（回答期限: 10/1）
- style.css … 緑の白ぬきボタン
- app.js … Googleスプレッドシート連携（POST/GET）
- gas/Code.gs … Google Apps Script（サーバ側）

## 1) スプレッドシート準備
1. Googleドライブでスプレッドシートを新規作成（例: flu_reservations）
2. 1行目に以下のヘッダを入れる：
   employee_id, department, full_name, choice, place, created_at
3. URLの `/d/` と `/edit` に挟まれたID文字列を控える（SHEET_ID）

## 2) Apps Script（GAS）
1. スプレッドシートから「拡張機能 → Apps Script」を開く
2. エディタに `gas/Code.gs` の内容を貼付
3. 先頭の `SHEET_ID` を控えたIDに置き換える
4. デプロイ →「新しいデプロイ」→ 種類「ウェブアプリ」→「全員」アクセス可でデプロイ
5. 発行されたURLを控える（例: https://script.google.com/macros/s/.../exec）

## 3) フロントの設定
1. `app.js` の CONFIG を編集：
   webhookUrl と remoteJsonUrl に 5. のURLをそのまま設定
2. サーバ（GitHub Pages 等）に index.html / style.css / app.js をアップロード
3. ブラウザでアクセス → 右下「管理」ボタン or `?admin=1` で一覧確認
   - 初期表示は「中央（GAS）＋この端末」の合体一覧です。

## 4) 使い方のポイント
- 送信時に中央（GAS）へPOST、画面表示は中央＋ローカルの合体を描画
- 重複チェックは中央＋ローカルで確認（PC間で重複登録を防止）
- CSVエクスポートは「中央＋ローカル」の合体を出力
- 「初期化」ボタンは**ローカルのみ**削除（中央のデータは消えません）

--
生成日: 20250929
