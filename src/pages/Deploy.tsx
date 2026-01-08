import { useState } from "react";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  Plus, 
  X, 
  CheckCircle,
  AlertCircle,
  Rocket
} from "lucide-react";
import { useTreasuryFactory } from "@/hooks/useTreasuryFactory";
import { useCreateTreasury, useAddWhitelistAddresses } from "@/hooks/useTreasuryDB";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/config";
import { ConnectButton } from "@/components/wallet/ConnectButton";

const PERIOD_OPTIONS = [
  { label: "No period (per-call limit)", value: "0" },
  { label: "1 hour", value: "3600" },
  { label: "6 hours", value: "21600" },
  { label: "12 hours", value: "43200" },
  { label: "1 day", value: "86400" },
  { label: "7 days", value: "604800" },
  { label: "30 days", value: "2592000" },
];

interface FormData {
  name: string;
  description: string;
  tokenAddress: string;
  maxSpendPerPeriod: string;
  periodSeconds: string;
  expiryDate: string;
  expiryTime: string;
  migrationTarget: string;
  whitelistAddresses: { address: string; label: string }[];
}

const initialFormData: FormData = {
  name: "",
  description: "",
  tokenAddress: CONTRACT_ADDRESSES.MNEE_TOKEN,
  maxSpendPerPeriod: "",
  periodSeconds: "86400",
  expiryDate: "",
  expiryTime: "",
  migrationTarget: "",
  whitelistAddresses: [{ address: "", label: "" }],
};

export default function Deploy() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);

  const { createTreasury, isPending, isSuccess, deployedAddress, reset } = useTreasuryFactory();
  const createTreasuryDB = useCreateTreasury();
  const addWhitelist = useAddWhitelistAddresses();

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const addWhitelistRow = () => {
    setFormData((prev) => ({
      ...prev,
      whitelistAddresses: [...prev.whitelistAddresses, { address: "", label: "" }],
    }));
  };

  const removeWhitelistRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      whitelistAddresses: prev.whitelistAddresses.filter((_, i) => i !== index),
    }));
  };

  const updateWhitelist = (index: number, field: "address" | "label", value: string) => {
    setFormData((prev) => ({
      ...prev,
      whitelistAddresses: prev.whitelistAddresses.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);

    if (currentStep === 1) {
      if (!formData.tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        setError("Please enter a valid token address");
        return false;
      }
      if (!formData.maxSpendPerPeriod || parseFloat(formData.maxSpendPerPeriod) <= 0) {
        setError("Please enter a valid max spend amount");
        return false;
      }
    }

    if (currentStep === 2) {
      const validAddresses = formData.whitelistAddresses.filter(
        (w) => w.address.match(/^0x[a-fA-F0-9]{40}$/)
      );
      if (validAddresses.length === 0) {
        setError("Please add at least one valid whitelist address");
        return false;
      }
    }

    if (currentStep === 3) {
      if (!formData.migrationTarget.match(/^0x[a-fA-F0-9]{40}$/)) {
        setError("Please enter a valid migration target address");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const handleDeploy = async () => {
    if (!address) return;
    if (!validateStep(3)) return;

    const expiryTimestamp = formData.expiryDate
      ? Math.floor(new Date(`${formData.expiryDate}T${formData.expiryTime || "00:00"}`).getTime() / 1000)
      : 0;

    const whitelist = formData.whitelistAddresses
      .filter((w) => w.address.match(/^0x[a-fA-F0-9]{40}$/))
      .map((w) => w.address as `0x${string}`);

    createTreasury({
      token: formData.tokenAddress as `0x${string}`,
      owner: address,
      maxSpendPerPeriod: formData.maxSpendPerPeriod,
      periodSeconds: parseInt(formData.periodSeconds),
      whitelist,
      expiryTimestamp,
      migrationTarget: formData.migrationTarget as `0x${string}`,
    });
  };

  // Save to database after successful deployment
  const handleSaveToDatabase = async () => {
    if (!deployedAddress || !address) return;

    const expiryTimestamp = formData.expiryDate
      ? Math.floor(new Date(`${formData.expiryDate}T${formData.expiryTime || "00:00"}`).getTime() / 1000)
      : null;

    try {
      const treasury = await createTreasuryDB.mutateAsync({
        address: deployedAddress,
        owner_address: address,
        token_address: formData.tokenAddress,
        max_spend_per_period: formData.maxSpendPerPeriod,
        period_seconds: parseInt(formData.periodSeconds),
        expiry_timestamp: expiryTimestamp,
        migration_target: formData.migrationTarget,
        name: formData.name || null,
        description: formData.description || null,
      });

      // Add whitelist addresses
      const validWhitelist = formData.whitelistAddresses.filter(
        (w) => w.address.match(/^0x[a-fA-F0-9]{40}$/)
      );
      if (validWhitelist.length > 0) {
        await addWhitelist.mutateAsync({
          treasuryId: treasury.id,
          addresses: validWhitelist,
        });
      }

      navigate(`/treasury/${deployedAddress}`);
    } catch (err) {
      console.error("Failed to save treasury:", err);
    }
  };

  if (!isConnected) {
    return (
      <Layout>
        <Card className="max-w-md mx-auto">
          <CardContent className="py-16 text-center">
            <CardTitle className="mb-4">Connect Wallet</CardTitle>
            <CardDescription className="mb-6">
              Connect your wallet to deploy a new treasury
            </CardDescription>
            <ConnectButton />
          </CardContent>
        </Card>
      </Layout>
    );
  }

  if (isSuccess && deployedAddress) {
    return (
      <Layout>
        <Card className="max-w-lg mx-auto">
          <CardContent className="py-16 text-center">
            <div className="rounded-full bg-green-500/10 p-4 w-fit mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="mb-2">Treasury Deployed!</CardTitle>
            <CardDescription className="mb-4">
              Your new PolicyTreasury has been successfully deployed
            </CardDescription>
            <code className="block text-sm bg-muted p-3 rounded-lg mb-6 font-mono">
              {deployedAddress}
            </code>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => { reset(); setFormData(initialFormData); setStep(1); }}>
                Deploy Another
              </Button>
              <Button onClick={handleSaveToDatabase} disabled={createTreasuryDB.isPending}>
                {createTreasuryDB.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                View Treasury
              </Button>
            </div>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deploy Treasury</h1>
          <p className="text-muted-foreground">
            Create a new PolicyTreasury with immutable spending rules
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s < step
                    ? "bg-primary text-primary-foreground"
                    : s === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              {s < 4 && (
                <div className={`h-0.5 w-12 ${s < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Config */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Spending Rules</CardTitle>
              <CardDescription>
                Configure the token and spending limits for your treasury
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Treasury Name (Optional)</Label>
                  <Input
                    id="name"
                    placeholder="My Treasury"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token">Token Address</Label>
                  <Input
                    id="token"
                    placeholder="0x..."
                    value={formData.tokenAddress}
                    onChange={(e) => updateField("tokenAddress", e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What is this treasury for?"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={2}
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxSpend">Max Spend Per Period</Label>
                  <div className="relative">
                    <Input
                      id="maxSpend"
                      type="number"
                      step="any"
                      placeholder="1000"
                      value={formData.maxSpendPerPeriod}
                      onChange={(e) => updateField("maxSpendPerPeriod", e.target.value)}
                      className="pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      MNEE
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">Period Duration</Label>
                  <Select
                    value={formData.periodSeconds}
                    onValueChange={(value) => updateField("periodSeconds", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIOD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => updateField("expiryDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryTime">Expiry Time</Label>
                  <Input
                    id="expiryTime"
                    type="time"
                    value={formData.expiryTime}
                    onChange={(e) => updateField("expiryTime", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Whitelist */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Whitelist Recipients</CardTitle>
              <CardDescription>
                Only these addresses can receive funds from the treasury
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.whitelistAddresses.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="0x... (recipient address)"
                      value={item.address}
                      onChange={(e) => updateWhitelist(index, "address", e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      placeholder="Label"
                      value={item.label}
                      onChange={(e) => updateWhitelist(index, "label", e.target.value)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeWhitelistRow(index)}
                    disabled={formData.whitelistAddresses.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addWhitelistRow} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Address
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Migration */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Migration Target</CardTitle>
              <CardDescription>
                Pre-approved address for migrating treasury funds (immutable after deployment)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="migration">Migration Target Address</Label>
                <Input
                  id="migration"
                  placeholder="0x..."
                  value={formData.migrationTarget}
                  onChange={(e) => updateField("migrationTarget", e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  This address will be automatically added to the whitelist and can receive migrated funds.
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The migration target cannot be changed after deployment. Make sure this is the correct address.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Deploy</CardTitle>
              <CardDescription>
                Confirm your treasury configuration before deployment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{formData.name || "Unnamed Treasury"}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Token</span>
                  <code className="text-sm">{formData.tokenAddress.slice(0, 10)}...</code>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Max Spend/Period</span>
                  <span className="font-medium">{formData.maxSpendPerPeriod} MNEE</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-medium">
                    {PERIOD_OPTIONS.find((o) => o.value === formData.periodSeconds)?.label}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Expiry</span>
                  <span className="font-medium">
                    {formData.expiryDate
                      ? `${formData.expiryDate} ${formData.expiryTime || ""}`
                      : "No expiry"}
                  </span>
                </div>
                <div className="py-2 border-b">
                  <span className="text-muted-foreground block mb-2">Whitelist</span>
                  <div className="flex flex-wrap gap-2">
                    {formData.whitelistAddresses
                      .filter((w) => w.address.match(/^0x[a-fA-F0-9]{40}$/))
                      .map((w, i) => (
                        <Badge key={i} variant="secondary">
                          {w.label || w.address.slice(0, 8) + "..."}
                        </Badge>
                      ))}
                  </div>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Migration Target</span>
                  <code className="text-sm">{formData.migrationTarget.slice(0, 10)}...</code>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  All parameters are immutable after deployment. Double-check everything before proceeding.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((prev) => prev - 1)}
            disabled={step === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {step < 4 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleDeploy} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Deploy Treasury
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}
