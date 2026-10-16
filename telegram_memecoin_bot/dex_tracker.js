/**
 * DexTracker Module: Bóc tách dữ liệu giá, thanh khoản, volume thực tế từ DexScreener API
 */

const https = require('https');

function fetchTokenPair(address) {
    return new Promise((resolve, reject) => {
        const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.pairs && parsed.pairs.length > 0) {
                        const basePairs = parsed.pairs.filter(p => p.chainId === 'base');
                        const bestPair = basePairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0] || parsed.pairs[0];
                        resolve(bestPair);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function scanAllTokens(tokens) {
    const results = [];
    for (const t of tokens) {
        try {
            const pair = await fetchTokenPair(t.address);
            if (pair) {
                results.push({
                    symbol: t.symbol,
                    name: pair.baseToken.name,
                    dex: pair.dexId.toUpperCase(),
                    pair: `${pair.baseToken.symbol}/${pair.quoteToken.symbol}`,
                    priceUsd: parseFloat(pair.priceUsd || 0),
                    liquidityUsd: parseFloat(pair.liquidity?.usd || 0),
                    fdvUsd: parseFloat(pair.fdv || 0),
                    volume24hUsd: parseFloat(pair.volume?.h24 || 0),
                    change5m: parseFloat(pair.priceChange?.m5 || 0),
                    change1h: parseFloat(pair.priceChange?.h1 || 0),
                    change24h: parseFloat(pair.priceChange?.h24 || 0),
                    url: pair.url
                });
            }
        } catch (err) {
            console.error(`Lỗi quét token ${t.symbol}:`, err.message);
        }
    }
    return results;
}

module.exports = { fetchTokenPair, scanAllTokens };
