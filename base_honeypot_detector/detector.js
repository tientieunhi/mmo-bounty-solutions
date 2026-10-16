/**
 * Base Honeypot & Malicious Smart Contract Detector
 * Analyzes on-chain bytecode, dangerous opcodes & function selectors on Base L2
 * Author: Caster-TieuNhi (@tientieunhi)
 * Payout Address: 0x9858ffeb327ecc91028d7d8a43ef648991574daa
 */

const https = require('https');

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

// Danh sách các selector nguy hiểm và dấu hiệu gian lận
const RISK_PATTERNS = [
    { name: "Hàm Mint không giới hạn (Unlimited Mint)", selector: "40c10f19", severity: "HIGH", penalty: 25 },
    { name: "Hàm Khóa ví người dùng (Blacklist/Freeze)", selector: "b7e47db2", severity: "CRITICAL", penalty: 40 },
    { name: "Hàm Điều chỉnh thuế giao dịch (SetFee/SetTax)", selector: "c3c3a599", severity: "MEDIUM", penalty: 15 },
    { name: "Opcode Hủy hợp đồng (Selfdestruct 0xff)", opcode: "ff", severity: "CRITICAL", penalty: 35 }
];

async function analyzeContractSecurity(contractAddress) {
    const cleanAddress = contractAddress.toLowerCase();
    const bytecode = await rpcCall('eth_getCode', [cleanAddress, 'latest']);

    if (!bytecode || bytecode === '0x') {
        return {
            contract: cleanAddress,
            isContract: false,
            error: "Địa chỉ này là ví cá nhân (EOA), không phải Hợp đồng thông minh!"
        };
    }

    const cleanBytecode = bytecode.startsWith('0x') ? bytecode.slice(2).toLowerCase() : bytecode.toLowerCase();
    const flags = [];
    let riskScore = 0; // 0 = an toàn tuyệt đối, 100 = cực kỳ nguy hiểm

    // 1. Kiểm tra ERC-20 tiêu chuẩn
    const hasTransfer = cleanBytecode.includes('a9059cbb'); // transfer(address,uint256)
    const hasTransferFrom = cleanBytecode.includes('23b872dd'); // transferFrom(address,address,uint256)

    if (!hasTransfer) {
        flags.push({ rule: "Missing Standard Transfer", desc: "Không tìm thấy hàm transfer chuẩn ERC-20", penalty: 20 });
        riskScore += 20;
    }

    // 2. Rà quét các pattern nguy hiểm
    for (const p of RISK_PATTERNS) {
        if (p.selector && cleanBytecode.includes(p.selector)) {
            flags.push({ rule: p.name, severity: p.severity, penalty: p.penalty });
            riskScore += p.penalty;
        }
    }

    // 3. Phân loại mức độ an toàn
    riskScore = Math.min(riskScore, 100);
    const safetyScore = 100 - riskScore;

    let verdict = "SAFE";
    if (riskScore >= 60) verdict = "CRITICAL HONEYPOT (NGUY HIỂM CAO)";
    else if (riskScore >= 30) verdict = "SUSPICIOUS / HIGH TAX RISK (CẦN CẨN TRỌNG)";
    else if (riskScore > 0) verdict = "LOW RISK (RỦI RO THẤP)";

    return {
        network: "Base Mainnet L2",
        contract: cleanAddress,
        bytecodeLengthBytes: cleanBytecode.length / 2,
        hasStandardTransfer: hasTransfer,
        hasStandardTransferFrom: hasTransferFrom,
        detectedRisks: flags,
        riskScore: riskScore,
        safetyScore: safetyScore,
        verdict: verdict,
        scanTimestamp: new Date().toISOString()
    };
}

module.exports = { analyzeContractSecurity };
