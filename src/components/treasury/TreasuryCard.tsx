import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Wallet, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import type { Treasury } from "@/hooks/useTreasuryDB";

interface TreasuryCardProps {
  treasury: Treasury;
  balance?: string;
  spentThisPeriod?: string;
  periodProgress?: number;
}

export function TreasuryCard({ 
  treasury, 
  balance = "0", 
  spentThisPeriod = "0",
  periodProgress = 0 
}: TreasuryCardProps) {
  const isExpired = treasury.expiry_timestamp 
    ? Date.now() / 1000 > treasury.expiry_timestamp 
    : false;

  const expiryDate = treasury.expiry_timestamp
    ? new Date(treasury.expiry_timestamp * 1000)
    : null;

  const periodLabel = treasury.period_seconds === 0
    ? "No period limit"
    : treasury.period_seconds < 3600
    ? `${treasury.period_seconds / 60} min period`
    : treasury.period_seconds < 86400
    ? `${treasury.period_seconds / 3600}h period`
    : `${treasury.period_seconds / 86400}d period`;

  return (
    <Link to={`/treasury/${treasury.address}`}>
      <Card className="group hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                {treasury.name || `Treasury ${treasury.address.slice(0, 8)}...`}
              </CardTitle>
              <p className="text-xs text-muted-foreground font-mono">
                {treasury.address.slice(0, 10)}...{treasury.address.slice(-8)}
              </p>
            </div>
            <Badge variant={isExpired ? "destructive" : "secondary"}>
              {isExpired ? "Expired" : "Active"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Balance */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="text-xl font-semibold">
                {parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 4 })} MNEE
              </p>
            </div>
          </div>

          {/* Period Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{periodLabel}</span>
              <span className="font-medium">
                {parseFloat(spentThisPeriod).toLocaleString()} / {parseFloat(treasury.max_spend_per_period).toLocaleString()}
              </span>
            </div>
            <Progress value={periodProgress} className="h-2" />
          </div>

          {/* Expiry */}
          {expiryDate && !isExpired && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Expires {formatDistanceToNow(expiryDate, { addSuffix: true })}</span>
            </div>
          )}

          {/* Arrow indicator */}
          <div className="flex justify-end pt-2">
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
