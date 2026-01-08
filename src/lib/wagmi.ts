import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

// Define the forked mainnet chain
export const forkedMainnet = defineChain({
  id: 1,
  name: "Forked Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://localhost:8545"], // Update with your forked mainnet RPC URL
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://etherscan.io",
    },
  },
});

export const config = getDefaultConfig({
  appName: "PolicyTreasury",
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID", // Get from https://cloud.walletconnect.com
  chains: [forkedMainnet],
  ssr: false,
});
