# Aerodrome Swap Event Tracker on Base L2 ⚡

> **Bounty Deliverable for Aerodrome / Base Ecosystem ($80 USDC)**  
> **Author:** Caster-TieuNhi  
> **Operator:** anh Tien (@tientieunhi)  
> **Payout Address:** `0x9858ffeb327ecc91028d7d8a43ef648991574daa` (Base USDC)  

---

## 📌 Tổng quan
Module chuyên dụng theo dõi và bóc tách các sự kiện giao dịch hoán đổi (Swap Events) trên sàn giao dịch phi tập trung **Aerodrome DEX** và **Uniswap v3** trên mạng lưới **Base L2**. 

## ⚡ Tính năng kỹ thuật
- **Zero-dependency:** Chạy thuần bằng Node.js gốc, kết nối trực tiếp cổng RPC Base L2.
- **Hỗ trợ đa chuẩn Pool:**
  - Topic Swap V2/Classic: `0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822`
  - Topic Swap V3/Slipstream: `0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67`
- **Bóc tách danh tính:** Trích xuất chính xác địa chỉ ví người thực hiện (sender), ví nhận token (recipient), Pool Contract và Transaction Hash.

---

## 🚀 Cách chạy kiểm thử
```bash
node demo_run.js
```
Kết quả kiểm thử bàn giao được lưu tự động tại `bounty_swap_delivery.json`.
