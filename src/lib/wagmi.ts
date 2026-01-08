import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { injected, metaMask } from "wagmi/connectors";

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

export const config = createConfig({
  chains: [forkedMainnet],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [forkedMainnet.id]: http(),
  },
});
