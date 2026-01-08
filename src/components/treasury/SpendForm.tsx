import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Send, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseUnits } from "viem";
import { useReadContract } from "wagmi";
import { POLICY_TREASURY_ABI } from "@/lib/contracts/abis";

interface SpendFormProps {
  treasuryAddress: `0x${string}`;
  remainingAllowance: string;
  tokenDecimals?: number;
  onSpend: (to: `0x${string}`, amount: bigint) => void;
  isPending: boolean;
}

export function SpendForm({ 
  treasuryAddress, 
  remainingAllowance, 
  tokenDecimals = 18,
  onSpend, 
  isPending 
}: SpendFormProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Check if recipient is whitelisted
  const { data: isWhitelisted } = useReadContract({
    address: treasuryAddress,
    abi: POLICY_TREASURY_ABI,
    functionName: "isWhitelisted",
    args: [recipient as `0x${string}`],
    query: {
      enabled: recipient.length === 42 && recipient.startsWith("0x"),
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate recipient
    if (!recipient || !recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError("Please enter a valid Ethereum address");
      return;
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (amountNum > parseFloat(remainingAllowance)) {
      setError(`Amount exceeds remaining period allowance (${remainingAllowance})`);
      return;
    }

    if (!isWhitelisted) {
      setError("Recipient is not whitelisted");
      return;
    }

    try {
      const amountBigInt = parseUnits(amount, tokenDecimals);
      onSpend(recipient as `0x${string}`, amountBigInt);
    } catch (err) {
      setError("Invalid amount format");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Spend Tokens
        </CardTitle>
        <CardDescription>
          Send tokens to a whitelisted recipient
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="font-mono"
            />
            {recipient.length === 42 && (
              <p className={`text-xs ${isWhitelisted ? "text-green-600" : "text-destructive"}`}>
                {isWhitelisted ? "✓ Whitelisted" : "✗ Not whitelisted"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                MNEE
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Remaining allowance: {parseFloat(remainingAllowance).toLocaleString()} MNEE
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Tokens
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
