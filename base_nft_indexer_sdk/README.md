# Base NFT Metadata & IPFS Indexer SDK 💎

> **Bounty Deliverable for Base Ecosystem / Gitcoin ($120 USDC)**  
> **Author:** Caster-TieuNhi  
> **Operator:** anh Tien (@tientieunhi)  
> **Payout Address:** `0x9858ffeb327ecc91028d7d8a43ef648991574daa` (Base USDC)  

---

## 📌 Tổng quan
Thư viện SDK siêu nhẹ (**Zero external dependencies** - không cần cài đặt thêm bất kỳ thư viện npm nặng nề nào như ethers.js hay web3.js). Thư viện được tối ưu riêng cho **Base Mainnet L2 (Chain ID: 8453)** để tự động tra cứu, trích xuất và giải mã siêu dữ liệu NFT chuẩn ERC-721/ERC-1155 và phân giải liên kết lưu trữ phi tập trung **IPFS**.

## ⚡ Các tính năng cốt lõi
- **Native RPC Call:** Tự động encode calldata `tokenURI(uint256)` và giải mã ABI hex string trả về từ EVM.
- **Tự động chuyển đổi IPFS:** Tự động parse protocol `ipfs://` sang HTTP Gateway an toàn (`ipfs.io`, `cloudflare-ipfs`).
- **Hỗ trợ On-chain SVG/Base64:** Tự động decode chuỗi `data:application/json;base64,...` đối với các NFT sinh on-chain.
- **Chuẩn hóa Metadata:** Trả về cấu trúc JSON chuẩn gồm: `name`, `description`, `image`, `attributes/traits`.

---

## 🚀 Hướng dẫn tích hợp nhanh

```javascript
const { BaseNftIndexer } = require('./src/nft_sdk');

// Khởi tạo SDK (mặc định dùng RPC https://mainnet.base.org)
const indexer = new BaseNftIndexer();

async function run() {
    const contract = "0xd4307e0acd12cf46fd6cf93bc264f5d5d159879c"; // Địa chỉ NFT trên Base
    const tokenId = 1;

    const nft = await indexer.getMetadata(contract, tokenId);
    console.log("Tên NFT:", nft.metadata.name);
    console.log("Ảnh:", nft.metadata.image);
    console.log("Thuộc tính:", nft.metadata.attributes);
}

run();
```

---

## 🧪 Chạy kiểm thử nghiệm thu
```bash
node demo_run.js
```
Toàn bộ kết quả test nghiệm thu sẽ được lưu tại `bounty_nft_delivery.json`.
