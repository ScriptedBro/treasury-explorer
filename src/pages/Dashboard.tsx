import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { Layout } from "@/components/layout/Layout";
import { TreasuryCard } from "@/components/treasury/TreasuryCard";
import { useTreasuries } from "@/hooks/useTreasuryDB";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Vault, TrendingUp, Clock, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

function DashboardStats({ treasuryCount }: { treasuryCount: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Treasuries</CardTitle>
          <Vault className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{treasuryCount}</div>
          <p className="text-xs text-muted-foreground">Active treasuries under your control</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value Locked</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">--</div>
          <p className="text-xs text-muted-foreground">Combined treasury balances</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Periods</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{treasuryCount}</div>
          <p className="text-xs text-muted-foreground">Treasuries with active spending periods</p>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Vault className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="mb-2">No Treasuries Yet</CardTitle>
        <CardDescription className="max-w-sm mb-6">
          Deploy your first PolicyTreasury to start managing funds with immutable on-chain spending rules.
        </CardDescription>
        <Link to="/deploy">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Deploy Treasury
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function ConnectWalletPrompt() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle className="mb-2">Connect Your Wallet</CardTitle>
        <CardDescription className="max-w-sm mb-6">
          Connect your wallet to view and manage your PolicyTreasury contracts.
        </CardDescription>
        <ConnectButton />
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { data: treasuries, isLoading } = useTreasuries(address);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your PolicyTreasury contracts
            </p>
          </div>
          {isConnected && (
            <Link to="/deploy">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Deploy Treasury
              </Button>
            </Link>
          )}
        </div>

        {!isConnected ? (
          <ConnectWalletPrompt />
        ) : (
          <>
            {/* Stats */}
            <DashboardStats treasuryCount={treasuries?.length || 0} />

            {/* Treasury List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your Treasuries</h2>
              
              {isLoading ? (
                <LoadingSkeleton />
              ) : treasuries?.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {treasuries?.map((treasury) => (
                    <TreasuryCard
                      key={treasury.id}
                      treasury={treasury}
                      balance="0"
                      spentThisPeriod="0"
                      periodProgress={0}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
