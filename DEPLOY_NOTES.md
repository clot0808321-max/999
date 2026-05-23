# Railway 部署注意

這版已修正 Railway `Cannot find module 'express'` 問題：

- 使用 Nixpacks
- 強制 build 時執行 `npm ci` / `npm install`
- 啟動前再次確認 `npm install --omit=dev`
- 移除 Dockerfile，避免 Railway 誤用 Docker build

## Railway Variables

```env
PERSIST_DIR=/data
SQLITE_PATH=/data/shop.sqlite
UPLOAD_DIR=/data/uploads
SESSION_SECRET=888SHOP_SECRET_2026
NIXPACKS_NODE_VERSION=20
```

## Volume

Mount Path：

```text
/data
```

## 上傳 GitHub

不要上傳：

```text
node_modules
```

要上傳全部其他檔案。

部署前建議 Railway：

```text
Settings → Clear Build Cache → Redeploy
```
