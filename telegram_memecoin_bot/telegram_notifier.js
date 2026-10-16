/**
 * TelegramNotifier Module: Định dạng và phát thông báo cảnh báo Telegram
 */

const https = require('https');

function formatTelegramAlert(tokenData, alertType = "VOLATILITY") {
    const isUp = tokenData.change1h >= 0;
    const arrow = isUp ? "🟢 TĂNG" : "🔴 GIẢM";
    const emoji = isUp ? "🚀" : "⚠️";

    return `
${emoji} <b>[BASE MEMECOIN ALERT]</b> - <b>$${tokenData.symbol}</b> ${arrow}
━━━━━━━━━━━━━━━━━━━
🪙 <b>Token:</b> ${tokenData.name} ($${tokenData.symbol})
📊 <b>Sàn DEX:</b> ${tokenData.dex} (Mạng Base L2)
💵 <b>Giá hiện tại:</b> <code>$${tokenData.priceUsd}</code>

📈 <b>Biến động:</b>
  • 5 phút: <b>${tokenData.change5m > 0 ? '+' : ''}${tokenData.change5m}%</b>
  • 1 giờ:  <b>${tokenData.change1h > 0 ? '+' : ''}${tokenData.change1h}%</b>
  • 24 giờ: <b>${tokenData.change24h > 0 ? '+' : ''}${tokenData.change24h}%</b>

💧 <b>Thanh khoản (Pool):</b> $${tokenData.liquidityUsd.toLocaleString()}
💎 <b>Vốn hóa (FDV):</b> $${tokenData.fdvUsd.toLocaleString()}
🔥 <b>Khối lượng 24h:</b> $${tokenData.volume24hUsd.toLocaleString()}

🔗 <a href="${tokenData.url}">Xem biểu đồ trên DexScreener</a>
━━━━━━━━━━━━━━━━━━━
🤖 <i>Bot phát triển bởi: Caster-TieuNhi (@tientieunhi)</i>
`;
}

function sendTelegramMessage(botToken, chatId, textHtml) {
    return new Promise((resolve, reject) => {
        if (!botToken || !chatId) {
            // Chế độ mô phỏng / local preview
            resolve({ simulated: true, message: "No bot token provided, preview only." });
            return;
        }

        const payload = JSON.stringify({
            chat_id: chatId,
            text: textHtml,
            parse_mode: "HTML",
            disable_web_page_preview: false
        });

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${botToken}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

module.exports = { formatTelegramAlert, sendTelegramMessage };
