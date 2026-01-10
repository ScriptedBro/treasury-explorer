import { useReadContracts } from "wagmi";
import { POLICY_TREASURY_ABI } from "@/lib/contracts/abis";
import { formatUnits } from "viem";
import type { Treasury } from "@/hooks/useTreasuryDB";

interface TreasuryOnChainData {
  address: string;
  balance: string;
  balanceRaw: bigint;
  spentThisPeriod: string;
  maxSpendPerPeriod: string;
  periodProgress: number;
}

export function useTreasuryBatchData(treasuries: Treasury[] | undefined) {
  const contracts: any[] = [];
  
  treasuries?.forEach((treasury) => {
    contracts.push(
      { address: treasury.address as `0x${string}`, abi: POLICY_TREASURY_ABI, functionName: 'balance' },
      { address: treasury.address as `0x${string}`, abi: POLICY_TREASURY_ABI, functionName: 'spentThisPeriod' },
      { address: treasury.address as `0x${string}`, abi: POLICY_TREASURY_ABI, functionName: 'maxSpendPerPeriod' }
    );
  });

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { enabled: contracts.length > 0 },
  });

  const treasuryDataMap = new Map<string, TreasuryOnChainData>();
  
  if (data && treasuries) {
    treasuries.forEach((treasury, index) => {
      const baseIndex = index * 3;
      const balanceResult = data[baseIndex];
      const spentResult = data[baseIndex + 1];
      const maxSpendResult = data[baseIndex + 2];
      
      const balanceRaw = balanceResult?.status === 'success' ? (balanceResult.result as bigint) : 0n;
      const spentRaw = spentResult?.status === 'success' ? (spentResult.result as bigint) : 0n;
      const maxSpendRaw = maxSpendResult?.status === 'success' ? (maxSpendResult.result as bigint) : 0n;
      
      const periodProgress = maxSpendRaw > 0n ? Number((spentRaw * 100n) / maxSpendRaw) : 0;
      
      treasuryDataMap.set(treasury.address.toLowerCase(), {
        address: treasury.address,
        balance: formatUnits(balanceRaw, 18),
        balanceRaw,
        spentThisPeriod: formatUnits(spentRaw, 18),
        maxSpendPerPeriod: formatUnits(maxSpendRaw, 18),
        periodProgress,
      });
    });
  }

  return { data: treasuryDataMap, isLoading, refetch };
}
