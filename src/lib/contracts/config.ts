// Contract addresses and chain configuration
// These are placeholder addresses - replace with actual deployed addresses

export const CONTRACT_ADDRESSES = {
  // TreasuryFactory contract address (deploy this first)
  TREASURY_FACTORY: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  // MNEE Token contract address
  MNEE_TOKEN: "0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF" as `0x${string}`,
} as const;

// Direct export for convenience
export const MNEE_TOKEN_ADDRESS = CONTRACT_ADDRESSES.MNEE_TOKEN;

// Chain configuration for forked Ethereum mainnet
export const FORKED_MAINNET_CHAIN = {
  id: 1,
  name: "Forked Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://localhost:8545"], // Update with your forked mainnet RPC
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://etherscan.io",
    },
  },
} as const;

// Token display configuration
export const TOKEN_CONFIG = {
  MNEE: {
    symbol: "MNEE",
    decimals: 18,
    name: "MNEE Token",
  },
} as const;
