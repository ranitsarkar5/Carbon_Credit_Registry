"use client";

import { useAppStore } from "@/store";
import { useEffect } from "react";

export default function Transactions() {
  const transactions = useAppStore((state) => state.transactions);
  const addTransaction = useAppStore((state) => state.addTransaction);

  // Simulate incoming real-time events for the sake of demonstration
  useEffect(() => {
    if (transactions.length > 0) return;
    
    // Simulate initial data
    addTransaction({
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      type: "Verify",
      status: "Confirmed",
      timestamp: Date.now() - 1000 * 60 * 5,
      explorerLink: "https://stellar.expert/explorer/testnet"
    });

    const interval = setInterval(() => {
      // Simulate real time live feed
      addTransaction({
        hash: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        type: "Mint",
        status: "Pending",
        timestamp: Date.now(),
        explorerLink: "https://stellar.expert/explorer/testnet"
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Transaction Center</h1>
      <p className="text-muted-foreground">Live feed of all carbon registry interactions on the Soroban testnet.</p>
      
      <div className="space-y-4">
        {transactions.map((tx, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-xl bg-card shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${
                tx.status === 'Confirmed' ? 'bg-green-500' :
                tx.status === 'Pending' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
              }`} />
              <div>
                <p className="font-medium">{tx.type} Operation</p>
                <p className="text-xs text-muted-foreground font-mono mt-1">Hash: {tx.hash.slice(0,16)}...</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <span className={`text-sm font-medium px-2 py-1 rounded-md ${
                tx.status === 'Confirmed' ? 'bg-green-500/10 text-green-500' :
                tx.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {tx.status}
              </span>
              <a href={tx.explorerLink} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">
                View Explorer
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
