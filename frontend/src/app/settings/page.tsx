"use client";

import { useStellar } from "@/providers/StellarWalletProvider";

export default function Settings() {
  const { address } = useStellar();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <div className="space-y-6">
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Wallet Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Connected Address</label>
              <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm">
                {address ? address : "Not Connected"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Network</label>
              <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm">
                Testnet (soroban-testnet.stellar.org)
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Auditor Preferences</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your IoT Oracle nodes and authorized auditors. (Requires Admin privileges on the Registry contract).
          </p>
          <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
            Connect an Admin wallet to manage auditors.
          </div>
        </div>
      </div>
    </div>
  );
}
