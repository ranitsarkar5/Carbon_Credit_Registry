"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StellarWalletProvider } from "@/providers/StellarWalletProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <StellarWalletProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </StellarWalletProvider>
    </QueryClientProvider>
  );
}
