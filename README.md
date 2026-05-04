# 999小店 PRO 升級版

## 已包含
- TG 自動接單通知
- USDT / ABA / 現金付款流程文字設定
- 後台商品上架、修改、刪除、圖片上傳
- 後台訂單管理、收款狀態、訂單狀態
- 客戶下單流程優化
- 一鍵開啟網站 bat
- 上線 Railway / Render 教學

## 開啟
雙擊：開啟網站.bat

或手動：
npm.cmd install
npm.cmd start

前台：http://localhost:3000
後台：http://localhost:3000/admin/login.html
帳密：admin / 123456

## TG通知設定
1. Telegram 搜尋 @BotFather
2. /newbot 建立 bot
3. 拿到 token 填入 .env 的 TG_BOT_TOKEN
4. 取得 chat id 填入 TG_CHAT_ID
5. 重啟網站

## 金流設定
到 .env 修改：
PAY_USDT_TRC20_ADDRESS
PAY_ABA_ACCOUNT_NAME
PAY_ABA_ACCOUNT_NUMBER
PAY_CASH_NOTE

## 一鍵上線（網域 + SSL）
推薦 Railway / Render。
上傳整個專案後，設定環境變數與 Start Command：
npm start
成功後會取得 https 網址，可再綁定自己的網域。
