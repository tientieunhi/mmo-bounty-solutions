/**
 * Base Gas Fee Optimizer & Surge Predictor
 * EIP-1559 Dynamic Fee Analysis on Base L2 (Chain ID: 8453)
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

function weiToGwei(weiHexOrBigInt) {
    const wei = typeof weiHexOrBigInt === 'string' ? BigInt(weiHexOrBigInt) : weiHexOrBigInt;
    return Number(wei) / 1e9;
}

async function analyzeBaseGas() {
    // 1. Lấy lịch sử phí 20 block gần nhất trên Base
    const blockCount = 20;
    const feeHistory = await rpcCall('eth_feeHistory', ['0x14', 'latest', [25, 50, 75]]);
    const gasPriceHex = await rpcCall('eth_gasPrice', []);

    const baseFees = feeHistory.baseFeePerGas.map(h => weiToGwei(h));
    const latestBaseFee = baseFees[baseFees.length - 1];
    const avgBaseFee = baseFees.reduce((a, b) => a + b, 0) / baseFees.length;

    // Phân tích priority fees
    let avgP25 = 0, avgP50 = 0, avgP75 = 0;
    const rewards = feeHistory.reward || [];
    if (rewards.length > 0) {
        rewards.forEach(r => {
            avgP25 += weiToGwei(r[0] || '0x0');
            avgP50 += weiToGwei(r[1] || '0x0');
            avgP75 += weiToGwei(r[2] || '0x0');
        });
        avgP25 /= rewards.length;
        avgP50 /= rewards.length;
        avgP75 /= rewards.length;
    }

    // Đảm bảo mức tối thiểu cho priority fee
    avgP25 = Math.max(avgP25, 0.001);
    avgP50 = Math.max(avgP50, 0.005);
    avgP75 = Math.max(avgP75, 0.01);

    // Tỉ lệ dùng gas trung bình của mạng
    const gasUsedRatios = feeHistory.gasUsedRatio || [];
    const avgCongestion = (gasUsedRatios.reduce((a, b) => a + b, 0) / (gasUsedRatios.length || 1)) * 100;

    let networkStatus = "SMOOTH (MẠNG ÊM Ả)";
    if (avgCongestion > 80) networkStatus = "CONGESTED (MẠNG NGHẼN CAO)";
    else if (avgCongestion > 50) networkStatus = "MODERATE (HOẠT ĐỘNG VỪA PHẢI)";

    // Ước tính chi phí giao dịch ra USD (ETH ~$2650)
    const ethPrice = 2650;
    const calcCostUsd = (gasLimit, gweiPrice) => {
        const ethCost = (gasLimit * gweiPrice * 1e9) / 1e18;
        return parseFloat((ethCost * ethPrice).toFixed(4));
    };

    const slowTotal = latestBaseFee + avgP25;
    const stdTotal = latestBaseFee + avgP50;
    const fastTotal = latestBaseFee + avgP75;

    return {
        network: "Base Mainnet L2",
        chainId: 8453,
        blocksSampled: blockCount,
        oldestBlock: parseInt(feeHistory.oldestBlock, 16),
        currentGasPriceGwei: weiToGwei(gasPriceHex),
        baseFeeGwei: {
            latest: parseFloat(latestBaseFee.toFixed(6)),
            twentyBlockAverage: parseFloat(avgBaseFee.toFixed(6))
        },
        networkCongestionPercent: parseFloat(avgCongestion.toFixed(2)),
        networkStatus: networkStatus,
        gasRecommendationsGwei: {
            slow: {
                maxFeePerGas: parseFloat(slowTotal.toFixed(6)),
                maxPriorityFeePerGas: parseFloat(avgP25.toFixed(6))
            },
            standard: {
                maxFeePerGas: parseFloat(stdTotal.toFixed(6)),
                maxPriorityFeePerGas: parseFloat(avgP50.toFixed(6))
            },
            fast: {
                maxFeePerGas: parseFloat(fastTotal.toFixed(6)),
                maxPriorityFeePerGas: parseFloat(avgP75.toFixed(6))
            }
        },
        estimatedCostsUsd: {
            ethTransfer: {
                gasLimit: 21000,
                slowUsd: calcCostUsd(21000, slowTotal),
                standardUsd: calcCostUsd(21000, stdTotal),
                fastUsd: calcCostUsd(21000, fastTotal)
            },
            dexSwapAerodrome: {
                gasLimit: 150000,
                slowUsd: calcCostUsd(150000, slowTotal),
                standardUsd: calcCostUsd(150000, stdTotal),
                fastUsd: calcCostUsd(150000, fastTotal)
            }
        },
        timestamp: new Date().toISOString()
    };
}

module.exports = { analyzeBaseGas };
