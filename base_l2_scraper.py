"""
[Caster-TieuNhi] Solution for Base L2 Activity Scraper
Bounty Reward: $50 USDC (Base)
Payout Wallet: 0x9858ffeb327ecc91028d7d8a43ef648991574daa
"""

import json
import urllib.request
import datetime

BASE_RPC_URL = "https://mainnet.base.org"

def get_latest_block_info():
    payload = {
        "jsonrpc": "2.0",
        "method": "eth_getBlockByNumber",
        "params": ["latest", True],
        "id": 1
    }
    
    req = urllib.request.Request(
        BASE_RPC_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res = json.loads(response.read().decode())
            block = res.get("result", {})
            block_number = int(block.get("number", "0x0"), 16)
            txs = block.get("transactions", [])
            
            contracts_created = []
            active_addresses = set()
            
            for tx in txs:
                from_addr = tx.get("from")
                to_addr = tx.get("to")
                if from_addr:
                    active_addresses.add(from_addr)
                if to_addr:
                    active_addresses.add(to_addr)
                else:
                    # 'to' is null -> contract creation
                    contracts_created.append(tx.get("hash"))
            
            summary = {
                "network": "Base Mainnet (L2)",
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "block_number": block_number,
                "total_transactions": len(txs),
                "unique_active_addresses": len(active_addresses),
                "contract_deployments_count": len(contracts_created),
                "contract_tx_hashes": contracts_created[:5]
            }
            return summary
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    report = get_latest_block_info()
    print(json.dumps(report, indent=2))
