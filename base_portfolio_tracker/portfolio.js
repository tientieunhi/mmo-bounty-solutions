/**
 * Base Portfolio & Multi-Token Balance Tracker
 * Author: Caster-TieuNhi (@tientieunhi)
 * Payout Address: 0x9858ffeb327ecc91028d7d8a43ef648991574daa
 */

const https = require('https');

const BASE_RPC_HOST = 'mainnet.base.org';

const TRACKED_TOKENS = [
    { symbol: "USDC", name: "USD Coin", address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", decimals: 6, priceUsd: 1.0 },
    { symbol: "BRETT", name: "Brett Memecoin", address: "0x532f27101965dd16442e59d40670faf5ebb142e4", decimals: 18, priceUsd: 0.0049 },
    { symbol: "DEGEN", name: "Degen Token", address: "0x4ed4e862860bed51a9570b96d89af5e1b0efefed", decimals: 18, priceUsd: 0.00096 },
    { symbol: "AERO", name: "Aerodrome Finance", address: "0x940181a94a35a4569e4529a3cdfb74e38fd98631", decimals: 18, priceUsd: 0.72 }
];

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

function encodeBalanceOf(walletAddress) {
    const selector = '0x70a08231';
    const cleanAddress = walletAddress.startsWith('0x') ? walletAddress.slice(2).toLowerCase() : walletAddress.toLowerCase();
    const padded = cleanAddress.padStart(64, '0');
    return selector + padded;
}

function parseUnits(hexBalance, decimals) {
    if (!hexBalance || hexBalance === '0x') return 0;
    const rawBig = BigInt(hexBalance);
    const divisor = BigInt(10 ** decimals);
    const integerPart = rawBig / divisor;
    const remainder = rawBig % divisor;
    const remStr = remainder.toString().padStart(decimals, '0');
    return parseFloat(`${integerPart}.${remStr}`);
}

async function getWalletPortfolio(walletAddress) {
    const cleanWallet = walletAddress.toLowerCase();

    // 1. Lấy số dư ETH gốc trên Base
    const ethBalanceHex = await rpcCall('eth_getBalance', [cleanWallet, 'latest']);
    const ethBalance = parseUnits(ethBalanceHex, 18);
    const ethPriceUsd = 2650.0; // Ước lượng ETH price
    const ethValueUsd = ethBalance * ethPriceUsd;

    const tokenBalances = [];
    let totalPortfolioUsd = ethValueUsd;

    // 2. Lấy số dư từng Token ERC-20
    for (const token of TRACKED_TOKENS) {
        try {
            const calldata = encodeBalanceOf(cleanWallet);
            const rawHex = await rpcCall('eth_call', [{ to: token.address, data: calldata }, 'latest']);
            const balance = parseUnits(rawHex, token.decimals);
            const valueUsd = balance * token.priceUsd;
            totalPortfolioUsd += valueUsd;

            tokenBalances.push({
                symbol: token.symbol,
                name: token.name,
                contract: token.address,
                balance: balance,
                unitPriceUsd: token.priceUsd,
                valueUsd: parseFloat(valueUsd.toFixed(2))
            });
        } catch (err) {
            tokenBalances.push({
                symbol: token.symbol,
                name: token.name,
                error: err.message
            });
        }
    }

    return {
        network: "Base Mainnet L2",
        wallet: cleanWallet,
        nativeAsset: {
            symbol: "ETH",
            balance: ethBalance,
            priceUsd: ethPriceUsd,
            valueUsd: parseFloat(ethValueUsd.toFixed(2))
        },
        erc20Tokens: tokenBalances,
        totalPortfolioUsd: parseFloat(totalPortfolioUsd.toFixed(2)),
        timestamp: new Date().toISOString()
    };
}

module.exports = { getWalletPortfolio };
