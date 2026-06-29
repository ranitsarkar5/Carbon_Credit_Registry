"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule, FREIGHTER_ID } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { isConnected, isAllowed, getAddress } from "@stellar/freighter-api";
import { Horizon } from "@stellar/stellar-sdk";

interface StellarContextType {
  address: string | null;
  balance: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  isFunding: boolean;
  fundWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const StellarContext = createContext<StellarContextType>({
  address: null,
  balance: null,
  connect: async () => {},
  disconnect: async () => {},
  isConnecting: false,
  isFunding: false,
  fundWallet: async () => {},
  refreshBalance: async () => {},
});

const horizonServer = new Horizon.Server("https://horizon-testnet.stellar.org");

export const StellarWalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFunding, setIsFunding] = useState(false);

  // Initialize StellarWalletsKit
  useEffect(() => {
    if (typeof window !== "undefined") {
      StellarWalletsKit.init({
        network: Networks.TESTNET,
        selectedWalletId: FREIGHTER_ID,
        modules: [new FreighterModule()],
      });
    }
  }, []);

  // Fetch XLM Balance
  const fetchBalance = useCallback(async (userAddress: string) => {
    try {
      const account = await horizonServer.loadAccount(userAddress);
      const nativeBalance = account.balances.find((b) => b.asset_type === "native");
      setBalance(nativeBalance ? nativeBalance.balance : "0.0000");
    } catch (error: any) {
      console.error("Error fetching balance:", error);
      // Account might not exist on network yet (unfunded)
      if (error.status === 404) {
        setBalance("0.0000 (Unfunded)");
      } else {
        setBalance("0.0000");
      }
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (address) {
      await fetchBalance(address);
    }
  }, [address, fetchBalance]);

  // Try to reconnect if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (typeof window === "undefined" || !(window as any).freighter) return;
        
        const connectionRes = await isConnected();
        const isConn = typeof connectionRes === "boolean" ? connectionRes : connectionRes?.isConnected;
        
        if (isConn) {
          const allowedRes = await isAllowed();
          const isAll = typeof allowedRes === "boolean" ? allowedRes : allowedRes?.isAllowed;
          
          if (isAll) {
            const addressRes = await getAddress();
            const addr = typeof addressRes === "string" ? addressRes : addressRes?.address;
            if (addr) {
              setAddress(addr);
            }
          }
        }
      } catch (e) {
        console.warn("Auto-reconnection failed:", e);
      }
    };

    checkConnection();
  }, []);

  // Poll balance when address changes
  useEffect(() => {
    if (address) {
      fetchBalance(address);
      const interval = setInterval(() => fetchBalance(address), 10000);
      return () => clearInterval(interval);
    } else {
      setBalance(null);
    }
  }, [address, fetchBalance]);

  const connect = async () => {
    setIsConnecting(true);
    try {
      // Use authModal which shows available modules (Freighter in our case)
      const { address: connectedAddress } = await StellarWalletsKit.authModal();
      if (connectedAddress) {
        setAddress(connectedAddress);
        await fetchBalance(connectedAddress);
      }
    } catch (error) {
      console.error("Connection failed", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await StellarWalletsKit.disconnect();
    } catch (e) {
      console.warn("Disconnect failed", e);
    }
    setAddress(null);
    setBalance(null);
  };

  // Fund Wallet using Testnet Friendbot
  const fundWallet = async () => {
    if (!address) return;
    setIsFunding(true);
    try {
      const response = await fetch(`https://friendbot.stellar.org/?addr=${address}`);
      if (response.ok) {
        await fetchBalance(address);
      } else {
        console.error("Friendbot funding failed:", await response.text());
      }
    } catch (error) {
      console.error("Friendbot request error:", error);
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <StellarContext.Provider
      value={{
        address,
        balance,
        connect,
        disconnect,
        isConnecting,
        isFunding,
        fundWallet,
        refreshBalance,
      }}
    >
      {children}
    </StellarContext.Provider>
  );
};

export const useStellar = () => useContext(StellarContext);

