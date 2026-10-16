/**
 * Base NFT Metadata & IPFS Indexer SDK
 * Zero-dependency, lightweight SDK for Base Mainnet (Chain ID 8453)
 * Developed by: Caster-TieuNhi (@tientieunhi)
 * Payout Address: 0x9858ffeb327ecc91028d7d8a43ef648991574daa
 */

const https = require('https');

const DEFAULT_BASE_RPC = 'https://mainnet.base.org';
const DEFAULT_IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

class BaseNftIndexer {
    constructor(rpcUrl = DEFAULT_BASE_RPC, ipfsGateway = DEFAULT_IPFS_GATEWAY) {
        this.rpcUrl = rpcUrl;
        this.ipfsGateway = ipfsGateway;
    }

    /**
     * Gửi RPC request tới node Base L2
     */
    _rpcCall(method, params) {
        return new Promise((resolve, reject) => {
            const url = new URL(this.rpcUrl);
            const postData = JSON.stringify({
                jsonrpc: '2.0',
                method: method,
                params: params,
                id: Date.now()
            });

            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
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

    /**
     * GET request hỗ trợ redirect và phân giải IPFS
     */
    _fetchJson(url) {
        return new Promise((resolve, reject) => {
            let targetUrl = url;
            if (targetUrl.startsWith('ipfs://')) {
                targetUrl = targetUrl.replace('ipfs://', this.ipfsGateway);
            }

            // Xử lý data URI base64
            if (targetUrl.startsWith('data:application/json;base64,')) {
                try {
                    const base64Data = targetUrl.replace('data:application/json;base64,', '');
                    const jsonStr = Buffer.from(base64Data, 'base64').toString('utf-8');
                    return resolve(JSON.parse(jsonStr));
                } catch (e) {
                    return reject(e);
                }
            }

            https.get(targetUrl, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return this._fetchJson(res.headers.location).then(resolve).catch(reject);
                }
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        // Nếu không phải json thì trả raw text
                        resolve({ raw: data });
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Mã hóa calldata gọi hàm tokenURI(uint256) chuẩn ERC-721
     * Selector: 0xc87b56dd
     */
    _encodeTokenUriCall(tokenId) {
        const selector = '0xc87b56dd';
        const hexTokenId = BigInt(tokenId).toString(16).padStart(64, '0');
        return selector + hexTokenId;
    }

    /**
     * Giải mã chuỗi string trả về từ ABI ERC-721
     */
    _decodeAbiString(hexData) {
        if (!hexData || hexData === '0x') return '';
        const clean = hexData.startsWith('0x') ? hexData.slice(2) : hexData;
        if (clean.length < 128) return '';

        // Offset 32 bytes đầu (0..64), Length 32 bytes tiếp theo (64..128)
        const lengthHex = clean.slice(64, 128);
        const length = parseInt(lengthHex, 16);
        const dataHex = clean.slice(128, 128 + (length * 2));

        return Buffer.from(dataHex, 'hex').toString('utf-8');
    }

    /**
     * Tra cứu và giải mã siêu dữ liệu NFT từ Smart Contract trên Base L2
     */
    async getMetadata(contractAddress, tokenId) {
        const calldata = this._encodeTokenUriCall(tokenId);
        const txObj = {
            to: contractAddress,
            data: calldata
        };

        const rawHex = await this._rpcCall('eth_call', [txObj, 'latest']);
        const tokenUri = this._decodeAbiString(rawHex);

        if (!tokenUri) {
            throw new Error(`Không lấy được tokenURI cho Contract: ${contractAddress}, TokenId: ${tokenId}`);
        }

        let parsedMetadata = {};
        try {
            parsedMetadata = await this._fetchJson(tokenUri);
        } catch (err) {
            parsedMetadata = { fetch_error: err.message };
        }

        // Chuẩn hóa đường link ảnh IPFS nếu có
        let imageUrl = parsedMetadata.image || parsedMetadata.image_url || '';
        if (imageUrl.startsWith('ipfs://')) {
            imageUrl = imageUrl.replace('ipfs://', this.ipfsGateway);
        }

        return {
            network: "Base Mainnet L2",
            chainId: 8453,
            contractAddress: contractAddress,
            tokenId: tokenId.toString(),
            tokenUriRaw: tokenUri,
            metadata: {
                name: parsedMetadata.name || `NFT #${tokenId}`,
                description: parsedMetadata.description || '',
                image: imageUrl,
                attributes: parsedMetadata.attributes || parsedMetadata.traits || [],
                raw_metadata: parsedMetadata
            },
            indexed_at: new Date().toISOString()
        };
    }
}

module.exports = { BaseNftIndexer };
