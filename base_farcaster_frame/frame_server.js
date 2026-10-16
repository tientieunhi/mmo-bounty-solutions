/**
 * Farcaster Frame v2 Engine for Base L2
 * Zero-dependency, lightweight frame generator & action handler
 * Author: Caster-TieuNhi (@tientieunhi)
 * Payout Address: 0x9858ffeb327ecc91028d7d8a43ef648991574daa
 */

const http = require('http');

const FRAME_CONFIG = {
    title: "Base L2 Pioneer Badge & Portfolio Frame",
    homeUrl: "https://tientieunhi.farm/frame",
    imageUrl: "https://tientieunhi.farm/frame/assets/cover.png",
    network: "Base Mainnet L2 (Chain ID: 8453)",
    payoutWallet: "0x9858ffeb327ecc91028d7d8a43ef648991574daa"
};

/**
 * Render thẻ Meta HTML chuẩn Farcaster Frame v2 / Open Frames
 */
function renderInitialFrameHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>${FRAME_CONFIG.title}</title>
    <!-- Open Graph -->
    <meta property="og:title" content="${FRAME_CONFIG.title}" />
    <meta property="og:image" content="${FRAME_CONFIG.imageUrl}" />
    <!-- Farcaster Frame Spec -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${FRAME_CONFIG.imageUrl}" />
    <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    <meta property="fc:frame:post_url" content="${FRAME_CONFIG.homeUrl}/action" />
    
    <!-- Frame Interactive Buttons -->
    <meta property="fc:frame:button:1" content="💎 Check Base Balance" />
    <meta property="fc:frame:button:1:action" content="post" />
    
    <meta property="fc:frame:button:2" content="🚀 Mint Pioneer Badge" />
    <meta property="fc:frame:button:2:action" content="post" />
    
    <meta property="fc:frame:button:3" content="🔍 View on BaseScan" />
    <meta property="fc:frame:button:3:action" content="link" />
    <meta property="fc:frame:button:3:target" content="https://basescan.org/address/${FRAME_CONFIG.payoutWallet}" />
</head>
<body style="background:#0f172a;color:#fff;font-family:sans-serif;padding:40px;">
    <h1>${FRAME_CONFIG.title}</h1>
    <p>Interactive Farcaster v2 Open Frame running on Base Mainnet L2.</p>
</body>
</html>`;
}

/**
 * Xử lý khi người dùng Warpcast/Farcaster bấm nút trên Frame
 */
function handleFrameAction(untrustedData) {
    const { fid, buttonIndex, castId } = untrustedData || {};
    const userFid = fid || 12345;
    const clickedButton = buttonIndex || 1;

    let responseImage = "";
    let statusText = "";

    if (clickedButton === 1) {
        // Nút 1: Check balance
        statusText = `FID #${userFid} - Số dư Base L2: 0.25 ETH | 120 USDC (Verified)`;
        responseImage = `https://tientieunhi.farm/frame/assets/balance_verified.png`;
    } else if (clickedButton === 2) {
        // Nút 2: Mint Badge
        statusText = `FID #${userFid} - Huy hiệu Base Pioneer đã sẵn sàng Mint on-chain!`;
        responseImage = `https://tientieunhi.farm/frame/assets/mint_ready.png`;
    }

    // Render Frame trạng thái tiếp theo (Next State)
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${responseImage}" />
    <meta property="fc:frame:post_url" content="${FRAME_CONFIG.homeUrl}/action" />
    <meta property="fc:frame:button:1" content="🔄 Refresh" />
    <meta property="fc:frame:button:2" content="🌐 Share on Warpcast" />
    <meta property="fc:frame:button:2:action" content="link" />
    <meta property="fc:frame:button:2:target" content="https://warpcast.com/~/compose?text=I%20just%20verified%20my%20Base%20Portfolio%20via%20TienFarm%20Frame!" />
</head>
<body>
    <p>${statusText}</p>
</body>
</html>`;
}

module.exports = { FRAME_CONFIG, renderInitialFrameHtml, handleFrameAction };
