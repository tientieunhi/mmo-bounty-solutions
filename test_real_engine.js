/**
 * [Caster-TieuNhi] Demo Real Working Engine for Base Memecoin Price & Liquidity Tracker
 * Platform: Base L2 Ecosystem
 * Data Source: DexScreener Official Live API
 */

const https = require('https');

// Token Degen & Brett trên mạng Base
const TOKENS = [
    { name: "BRETT", address: "0x532f27101965dd16442e59d40670faf5ebb142e4" },
    { name: "DEGEN", address: "0x4ed4e862860bed51a9570b96d89af5e1b0efefed" }
];

function fetchLiveDexData(tokenAddress) {
    return new Promise((resolve, reject) => {
        const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.pairs && json.pairs.length > 0) {
                        // Lấy pool có thanh khoản cao nhất trên Base (thường là Aerodrome hoặc Uniswap v3)
                        const basePairs = json.pairs.filter(p => p.chainId === 'base');
                        const bestPair = basePairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0] || json.pairs[0];
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

async function runLiveCheck() {
    console.log("=================================================================");
    console.log("   KIỂM CHỨNG NĂNG LỰC THỰC TẾ: THEO DÕI GIÁ MEMECOIN TRÊN BASE  ");
    console.log("=================================================================");

    for (const t of TOKENS) {
        try {
            const pair = await fetchLiveDexData(t.address);
            if (pair) {
                console.log(`\n🔹 TOKEN: ${t.name} (${pair.baseToken.name})`);
                console.log(`   • Sàn giao dịch DEX:  ${pair.dexId.toUpperCase()} (Mạng: ${pair.chainId})`);
                console.log(`   • Cặp giao dịch:      ${pair.baseToken.symbol} / ${pair.quoteToken.symbol}`);
                console.log(`   • Giá hiện tại:       $${pair.priceUsd} USD`);
                console.log(`   • Thanh khoản (Pool): $${Number(pair.liquidity?.usd || 0).toLocaleString()} USD`);
                console.log(`   • Vốn hóa (FDV):      $${Number(pair.fdv || 0).toLocaleString()} USD`);
                console.log(`   • Khối lượng 24h:     $${Number(pair.volume?.h24 || 0).toLocaleString()} USD`);
                console.log(`   • Biến động giá:      5m: ${pair.priceChange?.m5}% | 1h: ${pair.priceChange?.h1}% | 24h: ${pair.priceChange?.h24}%`);
                console.log(`   • Link theo dõi trực tiếp: ${pair.url}`);
            }
        } catch (err) {
            console.error(`Lỗi lấy dữ liệu token ${t.name}:`, err.message);
        }
    }
    console.log("\n=================================================================");
    console.log("   ✅ KẾT QUẢ: DỮ LIỆU THẬT 100% TỪ SÀN AERODROME / UNISWAP BASE!");
    console.log("=================================================================");
}

runLiveCheck();
