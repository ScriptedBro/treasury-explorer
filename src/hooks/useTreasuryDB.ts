import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Treasury = Tables<"treasuries">;
export type TreasuryInsert = TablesInsert<"treasuries">;
export type TreasuryTransaction = Tables<"treasury_transactions">;
export type TreasuryWhitelist = Tables<"treasury_whitelists">;

// Fetch all treasuries for an owner
export function useTreasuries(ownerAddress?: string) {
  return useQuery({
    queryKey: ["treasuries", ownerAddress],
    queryFn: async () => {
      let query = supabase
        .from("treasuries")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (ownerAddress) {
        query = query.eq("owner_address", ownerAddress.toLowerCase());
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!ownerAddress,
  });
}

// Fetch a single treasury by address
export function useTreasuryByAddress(address?: string) {
  return useQuery({
    queryKey: ["treasury", address],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treasuries")
        .select("*")
        .eq("address", address?.toLowerCase() || "")
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!address,
  });
}

// Fetch treasury whitelist
export function useTreasuryWhitelist(treasuryId?: string) {
  return useQuery({
    queryKey: ["treasury-whitelist", treasuryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treasury_whitelists")
        .select("*")
        .eq("treasury_id", treasuryId || "")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!treasuryId,
  });
}

// Fetch treasury transactions
export function useTreasuryTransactions(treasuryId?: string) {
  return useQuery({
    queryKey: ["treasury-transactions", treasuryId],
    queryFn: async () => {
      let query = supabase
        .from("treasury_transactions")
        .select("*, treasuries(address, name)")
        .order("block_timestamp", { ascending: false });
      
      if (treasuryId) {
        query = query.eq("treasury_id", treasuryId);
      }
      
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
  });
}

// Fetch all transactions (for history page)
export function useAllTransactions(ownerAddress?: string) {
  return useQuery({
    queryKey: ["all-transactions", ownerAddress],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treasury_transactions")
        .select("*, treasuries!inner(address, name, owner_address)")
        .eq("treasuries.owner_address", ownerAddress?.toLowerCase() || "")
        .order("block_timestamp", { ascending: false })
        .limit(200);
      
      if (error) throw error;
      return data;
    },
    enabled: !!ownerAddress,
  });
}

// Create a new treasury record
export function useCreateTreasury() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (treasury: TreasuryInsert) => {
      const { data, error } = await supabase
        .from("treasuries")
        .insert({
          ...treasury,
          address: treasury.address.toLowerCase(),
          owner_address: treasury.owner_address.toLowerCase(),
          token_address: treasury.token_address.toLowerCase(),
          migration_target: treasury.migration_target.toLowerCase(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasuries"] });
    },
  });
}

// Add whitelist addresses
export function useAddWhitelistAddresses() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ treasuryId, addresses }: { treasuryId: string; addresses: { address: string; label?: string }[] }) => {
      const records = addresses.map(a => ({
        treasury_id: treasuryId,
        address: a.address.toLowerCase(),
        label: a.label,
      }));
      
      const { data, error } = await supabase
        .from("treasury_whitelists")
        .insert(records)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["treasury-whitelist", variables.treasuryId] });
    },
  });
}

// Record a transaction
export function useRecordTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tx: TablesInsert<"treasury_transactions">) => {
      const { data, error } = await supabase
        .from("treasury_transactions")
        .insert({
          ...tx,
          from_address: tx.from_address.toLowerCase(),
          to_address: tx.to_address.toLowerCase(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["treasury-transactions", variables.treasury_id] });
      queryClient.invalidateQueries({ queryKey: ["all-transactions"] });
    },
  });
}

// Update treasury metadata
export function useUpdateTreasury() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Treasury> }) => {
      const { data, error } = await supabase
        .from("treasuries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasuries"] });
      queryClient.invalidateQueries({ queryKey: ["treasury"] });
    },
  });
}
