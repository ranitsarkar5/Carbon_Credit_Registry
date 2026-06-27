"use client";

import { useStellar } from "@/providers/StellarWalletProvider";
import Link from "next/link";
import { Button } from "./ui/button";

export function Navbar() {
  const { address, connect, disconnect, isConnecting } = useStellar();

  return (
    <nav className="flex items-center justify-between p-4 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Link href="/" className="font-bold text-xl text-primary flex items-center gap-2">
        <span className="text-2xl">🌱</span>
        <span className="hidden sm:inline">Stellar Carbon Registry</span>
      </Link>
      
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
          Dashboard
        </Link>
        <Link href="/transactions" className="text-sm font-medium hover:text-primary transition-colors">
          Transactions
        </Link>
        
        {address ? (
          <div className="flex items-center gap-2">
            <div className="bg-muted px-3 py-1.5 rounded-md text-xs font-mono">
              {address.slice(0, 4)}...{address.slice(-4)}
            </div>
            <Button variant="outline" size="sm" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button onClick={connect} disabled={isConnecting}>
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        )}
      </div>
    </nav>
  );
}
