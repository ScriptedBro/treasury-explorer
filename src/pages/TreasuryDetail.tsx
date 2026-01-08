import { useParams, Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { Layout } from "@/components/layout/Layout";
import { TreasuryDetails } from "@/components/treasury/TreasuryDetails";
import { PeriodTracker } from "@/components/treasury/PeriodTracker";
import { SpendForm } from "@/components/treasury/SpendForm";
import { MigrationPanel } from "@/components/treasury/MigrationPanel";
import { WhitelistViewer } from "@/components/treasury/WhitelistViewer";
import { TransactionList } from "@/components/treasury/TransactionList";
import { useTreasury } from "@/hooks/useTreasury";
import { useTreasuryByAddress, useTreasuryWhitelist, useTreasuryTransactions } from "@/hooks/useTreasuryDB";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, AlertCircle, Wallet } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConnectButton } from "@/components/wallet/ConnectButton";

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

export default function TreasuryDetail() {
  const { address: treasuryAddress } = useParams<{ address: string }>();
  const { address: userAddress, isConnected } = useAccount();

  const { data: treasuryDB, isLoading: isLoadingDB } = useTreasuryByAddress(treasuryAddress);
  const { data: whitelist } = useTreasuryWhitelist(treasuryDB?.id);
  const { data: transactions, isLoading: isLoadingTx } = useTreasuryTransactions(treasuryDB?.id);

  const {
    balance,
    owner,
    token,
    maxSpendPerPeriod,
    periodSeconds,
    expiryTimestamp,
    migrationTarget,
    spentThisPeriod,
    remainingAllowance,
    periodProgress,
    spend,
    migrate,
    isSpendPending,
    isMigratePending,
  } = useTreasury({
    address: treasuryAddress as `0x${string}`,
  });

  const isOwner = userAddress?.toLowerCase() === owner?.toLowerCase();
  const isExpired = expiryTimestamp > 0 && Date.now() / 1000 > expiryTimestamp;

  if (!isConnected) {
    return (
      <Layout>
        <Card className="max-w-md mx-auto">
          <CardContent className="py-16 text-center">
            <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="mb-2">Connect Your Wallet</CardTitle>
            <CardDescription className="mb-6">
              Connect your wallet to view treasury details
            </CardDescription>
            <ConnectButton />
          </CardContent>
        </Card>
      </Layout>
    );
  }

  if (isLoadingDB) {
    return (
      <Layout>
        <LoadingSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {treasuryDB?.name || "Treasury"}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              {treasuryAddress}
            </p>
          </div>
        </div>

        {/* Owner Alert */}
        {!isOwner && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You are viewing this treasury as a guest. Only the owner can execute transactions.
            </AlertDescription>
          </Alert>
        )}

        {/* Expired Alert */}
        {isExpired && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This treasury has expired and no longer accepts spending transactions.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="spend">Spend</TabsTrigger>
            <TabsTrigger value="whitelist">Whitelist</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Treasury Details */}
              <TreasuryDetails
                address={treasuryAddress || ""}
                owner={owner || ""}
                token={token || ""}
                maxSpendPerPeriod={maxSpendPerPeriod}
                periodSeconds={periodSeconds}
                expiryTimestamp={expiryTimestamp}
                migrationTarget={migrationTarget || ""}
                balance={balance}
                name={treasuryDB?.name || undefined}
              />

              {/* Period Tracker */}
              <div className="space-y-6">
                <PeriodTracker
                  periodSeconds={periodSeconds}
                  maxSpendPerPeriod={maxSpendPerPeriod}
                  spentThisPeriod={spentThisPeriod}
                  remainingAllowance={remainingAllowance}
                  periodProgress={periodProgress}
                />

                {/* Migration Panel */}
                {isOwner && migrationTarget && (
                  <MigrationPanel
                    migrationTarget={migrationTarget}
                    remainingAllowance={remainingAllowance}
                    balance={balance}
                    onMigrate={migrate}
                    isPending={isMigratePending}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="spend">
            <div className="max-w-md">
              {isOwner ? (
                <SpendForm
                  treasuryAddress={treasuryAddress as `0x${string}`}
                  remainingAllowance={remainingAllowance}
                  onSpend={spend}
                  isPending={isSpendPending}
                />
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
                    <CardTitle className="text-lg mb-2">Owner Only</CardTitle>
                    <CardDescription>
                      Only the treasury owner can execute spend transactions.
                    </CardDescription>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="whitelist">
            <div className="max-w-md">
              <WhitelistViewer
                treasuryAddress={treasuryAddress as `0x${string}`}
                savedWhitelist={whitelist || []}
              />
            </div>
          </TabsContent>

          <TabsContent value="history">
            <TransactionList
              transactions={transactions || []}
              isLoading={isLoadingTx}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
