"use client";

import { useAppStore } from "@/store";
import { useEffect, useState, useCallback } from "react";
import { fetchContractEvents, REGISTRY_CONTRACT_ID } from "@/lib/stellar";
import { AlertCircle, RefreshCw, Activity, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStellar } from "@/providers/StellarWalletProvider";

export default function Transactions() {
  const { address } = useStellar();
  const transactions = useAppStore((state) => state.transactions);
  const addTransaction = useAppStore((state) => state.addTransaction);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOnChainEvents = useCallback(async (showLoading = false) => {
    if (!REGISTRY_CONTRACT_ID) return;
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const events = await fetchContractEvents(REGISTRY_CONTRACT_ID);
      
      // Update store
      const existingHashes = new Set(transactions.map(tx => tx.hash));
      let newCount = 0;
      events.forEach(event => {
        if (!existingHashes.has(event.hash)) {
          addTransaction(event);
          newCount++;
        }
      });
      console.log(`Polled events from Soroban RPC: found ${events.length} events, added ${newCount} new.`);
    } catch (err: any) {
      console.error("Failed to load events from RPC:", err);
      setError("Unable to sync live transactions from Stellar Soroban RPC.");
    } finally {
      setIsLoading(false);
    }
  }, [addTransaction, transactions]);

  // Initial load and periodic polling
  useEffect(() => {
    loadOnChainEvents(true);
    
    // Poll every 10 seconds for new events
    const interval = setInterval(() => {
      loadOnChainEvents(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [loadOnChainEvents]);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-emerald-500 animate-pulse" />
          <div>
            <h1 className="text-3xl font-bold">Transaction Center</h1>
            <p className="text-muted-foreground text-sm mt-1">Live feed of all carbon registry interactions on the Soroban testnet.</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => loadOnChainEvents(true)} 
          disabled={isLoading}
          className="flex items-center gap-2 rounded-full"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? "Syncing..." : "Sync Feed"}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-2xl bg-card text-center text-muted-foreground">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="font-semibold text-lg mb-1 text-foreground">No On-Chain Activity Found</h3>
          <p className="max-w-md text-sm">
            There are no recent events recorded for the contract on the ledger. 
            Go to the Dashboard to register projects or mint credits, and they will stream here live!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx, i) => (
            <div key={tx.hash || i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 sm:mt-0 ${
                  tx.status === 'Confirmed' ? 'bg-green-500 shadow-green-500/50 shadow-md' :
                  tx.status === 'Pending' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                }`} />
                <div>
                  <p className="font-bold text-sm sm:text-base">{tx.type} Operation</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5 break-all">Hash: {tx.hash}</p>
                  {tx.details && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-1 bg-emerald-500/5 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10 w-fit">
                      Event Value: {tx.details}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4 border-t sm:border-0 pt-2 sm:pt-0">
                <span className="text-[10px] text-muted-foreground font-medium">
                  {new Date(tx.timestamp).toLocaleTimeString()}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  tx.status === 'Confirmed' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                  tx.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' : 'bg-red-500/10 text-red-500'
                }`}>
                  {tx.status}
                </span>
                <a href={tx.explorerLink} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-500 hover:text-blue-600 hover:underline">
                  Explorer ↗
                </a>

                {tx.type === "Transfer" && tx.sender && tx.destination && (
                  <div className="flex items-center gap-2">
                    {/* Return to Sender (if we are the destination / receiver) */}
                    {address && tx.destination.toLowerCase() === address.toLowerCase() && (
                      <a href={`/dashboard?refundTo=${tx.sender}&amount=${tx.amount}`}>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 bg-yellow-500/10 border-yellow-500/20 text-yellow-600 hover:bg-yellow-500 hover:text-white flex items-center gap-1 font-semibold rounded-md">
                          <RotateCcw className="h-3 w-3" />
                          Return to Sender
                        </Button>
                      </a>
                    )}
                    {/* Repeat Transfer (if we are the sender) */}
                    {address && tx.sender.toLowerCase() === address.toLowerCase() && (
                      <a href={`/dashboard?refundTo=${tx.destination}&amount=${tx.amount}`}>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20 flex items-center gap-1 font-semibold rounded-md">
                          <Send className="h-3 w-3" />
                          Repeat Transfer
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
