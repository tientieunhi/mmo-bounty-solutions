/**
 * [Caster-TieuNhi] Base L2 Multi-Block Onchain Crawler & Analyzer
 * Purpose: Extract Top Active Addresses & Smart Contract Deployments on Base Mainnet
 * Payout Wallet: 0x9858ffeb327ecc91028d7d8a43ef648991574daa
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_RPC_HOST = 'mainnet.base.org';

function rpcCall(method, params) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: Date.now()
        });

        const options = {
            hostname: BASE_RPC_HOST,
            port: 443,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (parsed.error) reject(new Error(parsed.error.message));
                    else resolve(parsed.result);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function runAnalysis() {
    console.log("=== BẮT ĐẦU CÀO DỮ LIỆU THỰC TẾ TRÊN BASE MAINNET ===");
    
    // 1. Lấy block mới nhất
    const latestBlockHex = await rpcCall('eth_blockNumber', []);
    const latestBlockNum = parseInt(latestBlockHex, 16);
    console.log(`Block mới nhất trên Base Mainnet: ${latestBlockNum} (${latestBlockHex})`);

    // 2. Cào 10 block liên tiếp gần nhất
    const blockCount = 10;
    const startBlock = latestBlockNum - blockCount + 1;
    console.log(`Đang quét ${blockCount} block từ ${startBlock} đến ${latestBlockNum}...`);

    let totalTxs = 0;
    const addressActivity = {};
    const contractDeployments = [];
    const blockTimestamps = [];

    for (let b = startBlock; b <= latestBlockNum; b++) {
        const hexNum = '0x' + b.toString(16);
        const block = await rpcCall('eth_getBlockByNumber', [hexNum, true]);
        if (!block) continue;

        blockTimestamps.push(parseInt(block.timestamp, 16));
        const txs = block.transactions || [];
        totalTxs += txs.length;

        for (const tx of txs) {
            const from = (tx.from || '').toLowerCase();
            const to = tx.to ? tx.to.toLowerCase() : null;

            if (from) {
                addressActivity[from] = (addressActivity[from] || 0) + 1;
            }
            if (to) {
                addressActivity[to] = (addressActivity[to] || 0) + 1;
            } else {
                // to = null nghĩa là contract deployment
                contractDeployments.push({
                    block: b,
                    txHash: tx.hash,
                    deployer: from,
                    gasUsed: parseInt(tx.gas, 16)
                });
            }
        }
    }

    // 3. Xếp hạng Top 10 địa chỉ hoạt động sôi nổi nhất
    const sortedAddresses = Object.entries(addressActivity)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([address, count], rank) => ({
            rank: rank + 1,
            address: address,
            interactions: count
        }));

    const avgBlockTime = blockTimestamps.length > 1 
        ? ((blockTimestamps[blockTimestamps.length - 1] - blockTimestamps[0]) / (blockTimestamps.length - 1)).toFixed(2)
        : 2.0;

    const result = {
        meta: {
            agent: "Caster-TieuNhi (Web3 Hunter)",
            operator: "@tientieunhi",
            network: "Base Mainnet L2 (Chain ID 8453)",
            rpc_endpoint: "https://mainnet.base.org",
            scanned_range: {
                from_block: startBlock,
                to_block: latestBlockNum,
                total_blocks: blockCount
            },
            scan_time_utc: new Date().toISOString(),
            payout_wallet: "0x9858ffeb327ecc91028d7d8a43ef648991574daa"
        },
        summary: {
            total_transactions: totalTxs,
            unique_active_addresses: Object.keys(addressActivity).length,
            smart_contracts_deployed: contractDeployments.length,
            average_block_time_seconds: parseFloat(avgBlockTime)
        },
        top_active_addresses: sortedAddresses,
        contract_deployments: contractDeployments
    };

    // 4. Lưu file JSON cấu trúc
    const outJsonPath = path.join(__dirname, 'base_l2_dataset.json');
    fs.writeFileSync(outJsonPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`Đã lưu dataset: ${outJsonPath}`);

    // 5. Tạo file Markdown báo cáo chuyên sâu
    const reportMd = `# BÁO CÁO PHÂN TÍCH HOẠT ĐỘNG ON-CHAIN BASE L2
**Agent thực hiện:** Caster-TieuNhi  
**Chủ quản:** anh Tiến (@tientieunhi)  
**Ví nhận tiền:** \`0x9858ffeb327ecc91028d7d8a43ef648991574daa\` (Base USDC)  
**Thời gian quét (UTC):** ${result.meta.scan_time_utc}  

---

## 1. TỔNG QUAN DỮ LIỆU QUÉT
- **Mạng lưới:** Base Mainnet L2 (Chain ID: 8453)
- **Khoảng Block phân tích:** \`${startBlock}\` đến \`${latestBlockNum}\` (Tổng cộng ${blockCount} blocks)
- **Tổng số giao dịch (Transactions):** **${totalTxs}** txs
- **Số lượng ví độc nhất hoạt động (Unique Addresses):** **${result.summary.unique_active_addresses}** ví
- **Hợp đồng thông minh mới được Deploy:** **${contractDeployments.length}** contracts
- **Tốc độ khối trung bình:** ~${avgBlockTime} giây/block

---

## 2. TOP ĐỊA CHỈ VÍ HOẠT ĐỘNG SÔI NỔI NHẤT TRÊN BASE
| Hạng | Địa chỉ ví | Số lượt tương tác trong 10 block |
| :---: | :--- | :---: |
${sortedAddresses.map(a => `| #${a.rank} | \`${a.address}\` | ${a.interactions} lượt |`).join('\n')}

---

## 3. DANH SÁCH SMART CONTRACT MỚI ĐƯỢC TRIỂN KHAI
${contractDeployments.length > 0 
    ? contractDeployments.map((c, i) => `### Hợp đồng #${i+1}\n- **Block:** \`${c.block}\`\n- **Tx Hash:** \`${c.txHash}\`\n- **Deployer (Người tạo):** \`${c.deployer}\`\n- **Gas Limit:** ${c.gasUsed}\n`).join('\n')
    : '*Không có hợp đồng nào được triển khai trong phạm vi 10 block vừa quét.*'}

---
*Báo cáo được trích xuất trực tiếp từ cổng RPC chính thức của Base L2 và niêm phong hoàn tất bởi Caster-TieuNhi.*
`;

    const outMdPath = path.join(__dirname, 'base_l2_analysis_report.md');
    fs.writeFileSync(outMdPath, reportMd, 'utf-8');
    console.log(`Đã xuất báo cáo Markdown: ${outMdPath}`);
    console.log("=== HOÀN TẤT THỰC THI 100% KHÔNG LỖI ===");
}

runAnalysis().catch(err => {
    console.error("LỖI:", err);
    process.exit(1);
});
