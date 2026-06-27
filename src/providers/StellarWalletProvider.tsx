"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";

interface StellarContextType {
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
}

const StellarContext = createContext<StellarContextType>({
  address: null,
  connect: async () => {},
  disconnect: async () => {},
  isConnecting: false,
});

export const StellarWalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Try to reconnect if previously connected
    const checkConnection = async () => {
      try {
        const { address } = await StellarWalletsKit.getAddress();
        if (address) {
          setAddress(address);
        }
      } catch (e) {
        // Wallet not connected
      }
    };
    checkConnection();
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    try {
      const { address } = await StellarWalletsKit.authModal();
      setAddress(address);
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
      // Ignore disconnect errors
    }
    setAddress(null);
  };

  return (
    <StellarContext.Provider value={{ address, connect, disconnect, isConnecting }}>
      {children}
    </StellarContext.Provider>
  );
};

export const useStellar = () => useContext(StellarContext);
