# 房間自動清理：啟用與驗收

2026-10-26：程式與本機自動測試已準備；尚未建立外部排程、尚未驗收正式網站。不要把此文件當作已啟用證明。

## 做什麼

每分鐘由外部服務 POST 到正式網站 /api/video/cleanup，只刪除帶有本產品 metadata 且已到期的 LiveKit 房間。這會斷開房內視訊，不刪 Supabase 待辦、預約或成果。尚未結束、沒有標記或格式不符的房間會跳過。

## 建議設定（由專案管理者操作）

可使用 cron-job.org，官方支援每分鐘、POST、自訂 headers 與執行紀錄。這是另一個服務帳號，需要管理者建立；本次未建立帳號或排程。

1. 等 Jasmin 部署含此修改的正式版；確認 HTTPS 網址正常、無 Preview 登入保護。
2. 確認 Vercel 的 LIVEKIT_URL、LIVEKIT_API_KEY、LIVEKIT_API_SECRET、VIDEO_CLEANUP_SECRET 已設定。
3. 在排程服務建立工作「雜事房過期視訊清理」，先保持停用。
4. URL 填正式網址加 /api/video/cleanup?dryRun=true。
5. Method 選 POST；自訂 header 名稱 Authorization，值為 Bearer 加一個空格再加 VIDEO_CLEANUP_SECRET。密鑰只填服務的私人設定，不要放 URL、截圖、文件或 GitHub。此服務會持有這個清理密鑰，但不需 LiveKit API secret。
6. 設定每分鐘執行，開啟失敗與恢復通知。先手動 Test run。
7. 必須收到 HTTP 200 與 JSON：dryRun 為 true、deleted 為 0。inspected 是看到的房間數，eligible 是符合過期條件的房間數。200 且全部為 0 只證明連線通了，不能證明有成功清理。
8. 完成下方房間驗收後，URL 移除 ?dryRun=true，確認 POST 不變，再啟用。
9. 查看後續至少兩次排程的執行紀錄。記錄啟用時間、正式網址、服務帳號管理者，不記錄 Secret。

排程目前沒有應用程式寄信告警；必須在排程服務設定通知並確認可收到。每分鐘約每天 1,440 次呼叫，留意服務與 Vercel 用量。

## 房間驗收

- 只在專用 LiveKit 測試專案或確認可清理全部過期測試房的環境執行真實清理。
- 準備一個透過本產品建立、有正確 metadata 的短測試房間，另保留尚未到期的測試房間。
- 到期後先 dry run，確認 eligible 大於 0 且房間仍存在。
- 執行真正的 POST：確認 deleted 大於 0、failed 為 0；LiveKit 已無到期房間，未到期房間仍存在。
- 再執行一次應安全完成，不需要重複刪同一房間。
- 一般瀏覽器會自行離開過期房間，所以僅看到瀏覽器離開不足以證明伺服器清理成功；需看 HTTP 回應與 LiveKit 房間紀錄。

## 錯誤與停用

- 401：header 或清理密鑰不一致；若是 Vercel 的保護頁，先確認使用的是可公開連線的正式網址。
- 404／405：網址或 Method 不對、版本尚未部署。
- 503：環境設定不足、LiveKit 失敗或部分刪除失敗。檢查回應 error／failed 和伺服器紀錄，下一分鐘會再嘗試仍存在的房間。
- HTML、跳轉或登入頁：不是成功，確認正式網址與部署保護，不要當成 HTTP 200 就算通過。
- 暫停時直接停用此排程工作，不需刪資料庫。緊急撤銷可更新 Vercel VIDEO_CLEANUP_SECRET 並重新部署，再同步排程設定。

## 限制

只啟用一份正式排程。若 Preview 和正式站共用 LiveKit，不能假設它們的房間隔離。結束時間取自建房當下 metadata，請勿在房間運作中改期而不更新 metadata。正常情況最多約一分鐘加網路處理時間才清理，不保證即時；服務暫停／故障期間不執行。舊的未標記房間不在清理範圍。

參考：https://cron-job.org/en/faq/ 、https://docs.cron-job.org/creating-cron-jobs.html

曾評估 Supabase pg_net + Vault，但解密後的 request header 仍會短暫進入佇列；目前先採獨立 HTTP 排程，避免新增資料庫排程與密鑰處理。參考：https://supabase.com/kb/troubleshooting/database-roles-can-read-request-headers-queued-by-pg_net
