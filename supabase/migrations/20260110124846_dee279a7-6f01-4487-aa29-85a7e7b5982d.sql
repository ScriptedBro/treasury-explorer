-- Remove the overly permissive UPDATE policy on treasuries
-- In a Web3 app where blockchain is source of truth, we can:
-- 1. Allow updates to non-critical metadata fields only (name, description)
-- 2. Or restrict updates entirely
-- Let's be more restrictive - only allow name/description updates

DROP POLICY IF EXISTS "Anyone can update treasury metadata only" ON public.treasuries;

-- Since RLS cannot check which columns are being updated, 
-- and critical fields like owner_address, token_address etc. should never change,
-- we'll disable UPDATE entirely. The blockchain is the source of truth.
-- If metadata updates are needed, use an admin edge function with service role.