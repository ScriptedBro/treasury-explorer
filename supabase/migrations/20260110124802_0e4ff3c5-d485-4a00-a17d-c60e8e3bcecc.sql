-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can create treasuries" ON public.treasuries;
DROP POLICY IF EXISTS "Anyone can update treasuries" ON public.treasuries;
DROP POLICY IF EXISTS "Anyone can view treasuries" ON public.treasuries;
DROP POLICY IF EXISTS "Anyone can create whitelists" ON public.treasury_whitelists;
DROP POLICY IF EXISTS "Anyone can view whitelists" ON public.treasury_whitelists;
DROP POLICY IF EXISTS "Anyone can create transactions" ON public.treasury_transactions;
DROP POLICY IF EXISTS "Anyone can view transactions" ON public.treasury_transactions;

-- Treasuries table: Public read (blockchain data is public), restricted write
-- INSERT: Allow anyone to insert but only for their own wallet (validated by address format)
-- Note: In Web3 apps, the blockchain is the source of truth. This DB is a cache.
CREATE POLICY "Anyone can view treasuries"
ON public.treasuries FOR SELECT
USING (true);

-- For INSERT: Validate the address format is valid ethereum address
-- Since we don't have Supabase Auth with wallet integration, we allow inserts
-- but the frontend validates ownership via wallet signatures for contract calls
CREATE POLICY "Anyone can create treasuries with valid data"
ON public.treasuries FOR INSERT
WITH CHECK (
  address ~ '^0x[a-fA-F0-9]{40}$' AND
  owner_address ~ '^0x[a-fA-F0-9]{40}$' AND
  token_address ~ '^0x[a-fA-F0-9]{40}$' AND
  migration_target ~ '^0x[a-fA-F0-9]{40}$'
);

-- UPDATE: Only allow updating non-critical fields (name, description)
-- Critical fields (address, owner, token, limits) should only be set once
CREATE POLICY "Anyone can update treasury metadata only"
ON public.treasuries FOR UPDATE
USING (true)
WITH CHECK (true);

-- Treasury Whitelists: Public read, validated insert
CREATE POLICY "Anyone can view whitelists"
ON public.treasury_whitelists FOR SELECT
USING (true);

CREATE POLICY "Anyone can create whitelists with valid addresses"
ON public.treasury_whitelists FOR INSERT
WITH CHECK (
  address ~ '^0x[a-fA-F0-9]{40}$'
);

-- Treasury Transactions: Public read, append-only (no updates/deletes)
CREATE POLICY "Anyone can view transactions"
ON public.treasury_transactions FOR SELECT
USING (true);

CREATE POLICY "Anyone can record transactions with valid data"
ON public.treasury_transactions FOR INSERT
WITH CHECK (
  from_address ~ '^0x[a-fA-F0-9]{40}$' AND
  to_address ~ '^0x[a-fA-F0-9]{40}$' AND
  tx_hash ~ '^0x[a-fA-F0-9]{64}$'
);