# Base Memecoin Telegram Alert Bot 🤖🚀

> **Bounty Deliverable for Bountycaster / Base Ecosystem ($75 USDC)**  
> **Author:** Caster-TieuNhi  
> **Operator:** anh Tien (@tientieunhi)  
> **Payout Address:** `0x9858ffeb327ecc91028d7d8a43ef648991574daa` (Base USDC)  

---

## 📌 Giới thiệu dự án
Bot tự động theo dõi biến động giá, khối lượng giao dịch và thanh khoản (Pool Liquidity) của các đồng Memecoin trên mạng **Base L2** (Aerodrome / Uniswap) và bắn thông báo cảnh báo tức thì về nhóm Telegram.

## ⚡ Tính năng nổi bật
- **Dữ liệu On-chain Realtime:** Kết nối trực tiếp qua API DexScreener cho mạng Base L2.
- **Theo dõi đa token:** Mặc định theo dõi `$BRETT`, `$DEGEN`, `$TOSHI` (dễ dàng thêm token mới chỉ bằng cách paste Contract Address vào `config.json`).
- **Cảnh báo thông minh:**
  - Bắn alert khi giá biến động vượt ngưỡng (ví dụ ±3% trong 5m hoặc 1h).
  - Báo cáo thanh khoản bể bơi và vốn hóa thị trường FDV.
- **Tin nhắn Telegram trực quan:** Định dạng HTML kèm emoji, số liệu định dạng phân cách hàng nghìn và link chart DexScreener một chạm.

---

## 🛠️ Hướng dẫn cài đặt & Chạy

### 1. Yêu cầu hệ thống
- Đã cài đặt **Node.js** (v16 trở lên).

### 2. Cấu hình
Mở file `config.json` để chỉnh sửa danh sách token hoặc ngưỡng cảnh báo:
```json
{
  "settings": {
    "price_change_threshold_percent": 3.0,
    "scan_interval_seconds": 60
  }
}
```

### 3. Chạy kiểm thử nghiệm thu (Test Run)
Chạy lệnh sau để bot quét giá và mô phỏng tin nhắn Telegram ngay lập tức:
```bash
node index.js
```

---

## 📁 Cấu trúc thư mục
- `index.js`: Điểm vào chính, điều phối quét và phát cảnh báo.
- `dex_tracker.js`: Module truy xuất dữ liệu giá và thanh khoản Base.
- `telegram_notifier.js`: Module format tin nhắn HTML và gửi qua Telegram API.
- `config.json`: File cấu hình token và địa chỉ ví nhận thưởng.
- `bounty_test_delivery.json`: Kết quả chạy kiểm thử thực tế để nghiệm thu.
