"use client";

import { useStellar } from "@/providers/StellarWalletProvider";
import { useEffect, useState } from "react";
import { isAuditor, getAdmin, REGISTRY_CONTRACT_ID, ASSET_CONTRACT_ID } from "@/lib/stellar";
import { ShieldCheck, User, Settings as SettingsIcon, AlertCircle } from "lucide-react";

export default function Settings() {
  const { address } = useStellar();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUserAuditor, setIsUserAuditor] = useState(false);
  const [adminAddress, setAdminAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadRoleData() {
      if (!address) return;
      setIsLoading(true);
      try {
        const admin = await getAdmin();
        setAdminAddress(admin);
        
        if (admin && address.toUpperCase() === admin.toUpperCase()) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }

        const auditorCheck = await isAuditor(address);
        setIsUserAuditor(auditorCheck);
      } catch (err) {
        console.error("Failed to load settings role data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRoleData();
  }, [address]);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-emerald-500" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      
      <div className="space-y-6">
        {/* Wallet & Roles configuration */}
        <div className="p-6 border rounded-xl bg-card shadow-sm space-y-4">
          <h2 className="text-xl font-semibold mb-2">Wallet & System Role</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Connected Address</label>
              <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                {address ? address : "Not Connected"}
              </div>
            </div>
            
            {address && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Your Verified Role</label>
                <div className="mt-1.5 flex gap-2 flex-wrap">
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Registry Admin
                    </span>
                  )}
                  {isUserAuditor && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Authorized Auditor (Oracle)
                    </span>
                  )}
                  {!isAdmin && !isUserAuditor && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <User className="h-3.5 w-3.5" />
                      Standard User / Project Owner
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contract Config */}
        <div className="p-6 border rounded-xl bg-card shadow-sm space-y-4">
          <h2 className="text-xl font-semibold mb-2">Registry Smart Contracts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Registry Contract ID</span>
              <div className="p-2.5 bg-muted rounded font-mono text-xs break-all border border-border/50">
                {REGISTRY_CONTRACT_ID || "Not Configured"}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Carbon Asset (CCT) Contract ID</span>
              <div className="p-2.5 bg-muted rounded font-mono text-xs break-all border border-border/50">
                {ASSET_CONTRACT_ID || "Not Configured"}
              </div>
            </div>
          </div>
          <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded flex items-start gap-2 text-yellow-600 dark:text-yellow-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>These addresses are set in your environment configuration and represent the active registry system on Stellar Testnet.</p>
          </div>
        </div>

        {/* Auditor preferences panel */}
        <div className="p-6 border rounded-xl bg-card shadow-sm space-y-4">
          <h2 className="text-xl font-semibold mb-2">Auditor & Oracle System</h2>
          <p className="text-sm text-muted-foreground">
            The Carbon Registry uses a multi-auditor architecture. The Admin whitelists trusted accounts (e.g. IoT Sensor Oracles, certified auditors) who then write validated clean energy metrics on-chain.
          </p>
          <div className="border border-border/50 rounded-lg p-4 bg-muted/30">
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Contract Administrative Credentials</h3>
            {isLoading ? (
              <p className="text-xs font-mono">Querying blockchain state...</p>
            ) : (
              <p className="text-xs font-mono break-all text-muted-foreground">
                Current Admin Address: <span className="text-foreground">{adminAddress || "Unknown"}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
