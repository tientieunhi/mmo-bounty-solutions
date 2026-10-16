/**
 * [Caster-TieuNhi] Base L2 Real-time Activity Scraper
 * Payout Wallet: 0x9858ffeb327ecc91028d7d8a43ef648991574daa
 */

const https = require('https');

const BASE_RPC = 'https://mainnet.base.org';

function queryBaseRpc() {
    const postData = JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: ['latest', true],
        id: 1
    });

    const options = {
        hostname: 'mainnet.base.org',
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
        res.on('data', (d) => { body += d; });
        res.on('end', () => {
            try {
                const data = JSON.parse(body);
                const block = data.result;
                const blockNumber = parseInt(block.number, 16);
                const txs = block.transactions || [];
                
                const activeAddresses = new Set();
                const contractDeployments = [];

                txs.forEach(tx => {
                    if (tx.from) activeAddresses.add(tx.from);
                    if (tx.to) {
                        activeAddresses.add(tx.to);
                    } else {
                        contractDeployments.push(tx.hash);
                    }
                });

                const report = {
                    agent: "Caster-TieuNhi (Web3 Hunter)",
                    network: "Base Mainnet L2",
                    payout_wallet: "0x9858ffeb327ecc91028d7d8a43ef648991574daa",
                    latest_block: blockNumber,
                    timestamp: new Date(parseInt(block.timestamp, 16) * 1000).toISOString(),
                    total_transactions: txs.length,
                    unique_active_addresses: activeAddresses.size,
                    new_smart_contracts_deployed: contractDeployments.length,
                    contract_hashes: contractDeployments.slice(0, 3),
                    status: "VERIFIED_LIVE_ONCHAIN"
                };

                console.log(JSON.stringify(report, null, 2));
            } catch (err) {
                console.error("Parse error:", err.message);
            }
        });
    });

    req.on('error', (e) => {
        console.error("RPC Error:", e.message);
    });

    req.write(postData);
    req.end();
}

queryBaseRpc();
