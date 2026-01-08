
-- Create treasuries table to store metadata and enable faster queries
CREATE TABLE public.treasuries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT NOT NULL UNIQUE,
    owner_address TEXT NOT NULL,
    token_address TEXT NOT NULL,
    max_spend_per_period TEXT NOT NULL,
    period_seconds INTEGER NOT NULL,
    expiry_timestamp BIGINT,
    migration_target TEXT NOT NULL,
    name TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    chain_id INTEGER NOT NULL DEFAULT 1,
    deployment_tx_hash TEXT
);

-- Create whitelist addresses table
CREATE TABLE public.treasury_whitelists (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    treasury_id UUID NOT NULL REFERENCES public.treasuries(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    label TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(treasury_id, address)
);

-- Create transaction history table
CREATE TABLE public.treasury_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    treasury_id UUID NOT NULL REFERENCES public.treasuries(id) ON DELETE CASCADE,
    tx_hash TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL CHECK (event_type IN ('spend', 'migration', 'deposit')),
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount TEXT NOT NULL,
    period_index INTEGER,
    block_number BIGINT NOT NULL,
    block_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.treasuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_whitelists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for treasuries - public read, owner write
CREATE POLICY "Anyone can view treasuries" 
ON public.treasuries 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create treasuries" 
ON public.treasuries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update treasuries" 
ON public.treasuries 
FOR UPDATE 
USING (true);

-- RLS Policies for whitelists
CREATE POLICY "Anyone can view whitelists" 
ON public.treasury_whitelists 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create whitelists" 
ON public.treasury_whitelists 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for transactions
CREATE POLICY "Anyone can view transactions" 
ON public.treasury_transactions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create transactions" 
ON public.treasury_transactions 
FOR INSERT 
WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_treasuries_updated_at
BEFORE UPDATE ON public.treasuries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_treasuries_owner ON public.treasuries(owner_address);
CREATE INDEX idx_treasury_transactions_treasury ON public.treasury_transactions(treasury_id);
CREATE INDEX idx_treasury_transactions_block ON public.treasury_transactions(block_timestamp);
