/**
 * Curated list crypto untuk autocomplete.
 * Top ~50 crypto by market cap.
 * Harga di-fetch dari CoinGecko (lihat coingecko.ts).
 */
export type CryptoSuggestion = {
    ticker: string
    name: string
}

export const CURATED_CRYPTO: CryptoSuggestion[] = [
    { ticker: 'BTC', name: 'Bitcoin' },
    { ticker: 'ETH', name: 'Ethereum' },
    { ticker: 'USDT', name: 'Tether' },
    { ticker: 'BNB', name: 'BNB' },
    { ticker: 'SOL', name: 'Solana' },
    { ticker: 'USDC', name: 'USD Coin' },
    { ticker: 'XRP', name: 'XRP' },
    { ticker: 'ADA', name: 'Cardano' },
    { ticker: 'DOGE', name: 'Dogecoin' },
    { ticker: 'AVAX', name: 'Avalanche' },
    { ticker: 'DOT', name: 'Polkadot' },
    { ticker: 'TRX', name: 'TRON' },
    { ticker: 'MATIC', name: 'Polygon' },
    { ticker: 'LINK', name: 'Chainlink' },
    { ticker: 'TON', name: 'Toncoin' },
    { ticker: 'SHIB', name: 'Shiba Inu' },
    { ticker: 'LTC', name: 'Litecoin' },
    { ticker: 'BCH', name: 'Bitcoin Cash' },
    { ticker: 'UNI', name: 'Uniswap' },
    { ticker: 'ATOM', name: 'Cosmos' },
    { ticker: 'XLM', name: 'Stellar' },
    { ticker: 'ETC', name: 'Ethereum Classic' },
    { ticker: 'FIL', name: 'Filecoin' },
    { ticker: 'APT', name: 'Aptos' },
    { ticker: 'ARB', name: 'Arbitrum' },
    { ticker: 'OP', name: 'Optimism' },
    { ticker: 'NEAR', name: 'NEAR Protocol' },
    { ticker: 'ICP', name: 'Internet Computer' },
    { ticker: 'AAVE', name: 'Aave' },
    { ticker: 'ALGO', name: 'Algorand' },
    { ticker: 'VET', name: 'VeChain' },
    { ticker: 'FTM', name: 'Fantom' },
    { ticker: 'SAND', name: 'The Sandbox' },
    { ticker: 'MANA', name: 'Decentraland' },
    { ticker: 'AXS', name: 'Axie Infinity' },
    { ticker: 'GRT', name: 'The Graph' },
    { ticker: 'IMX', name: 'Immutable' },
    { ticker: 'RNDR', name: 'Render' },
    { ticker: 'INJ', name: 'Injective' },
    { ticker: 'SUI', name: 'Sui' },
    { ticker: 'SEI', name: 'Sei' },
    { ticker: 'TIA', name: 'Celestia' },
    { ticker: 'STX', name: 'Stacks' },
    { ticker: 'RUNE', name: 'THORChain' },
    { ticker: 'LDO', name: 'Lido DAO' },
    { ticker: 'CRV', name: 'Curve DAO' },
    { ticker: 'MKR', name: 'Maker' },
    { ticker: 'SNX', name: 'Synthetix' },
    { ticker: 'COMP', name: 'Compound' },
    { ticker: 'ZEC', name: 'Zcash' },
]

export function searchCryptoTickers(query: string): CryptoSuggestion[] {
    const q = query.trim().toUpperCase()
    if (!q) return CURATED_CRYPTO.slice(0, 10)

    return CURATED_CRYPTO.filter(
        (c) => c.ticker.includes(q) || c.name.toUpperCase().includes(q)
    ).slice(0, 15)
}