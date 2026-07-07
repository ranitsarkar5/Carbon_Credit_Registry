"use client";

import { useStellar } from "@/providers/StellarWalletProvider";
import { useTheme } from "@/providers/ThemeProvider";
import Link from "next/link";
import { Button } from "./ui/button";
import { useState } from "react";
import { Menu, X, Leaf, Sun, Moon } from "lucide-react";

export function Navbar() {
  const { address, balance, connect, disconnect, isConnecting } = useStellar();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Transactions", href: "/transactions" },
    { name: "Analytics", href: "/analytics" },
    { name: "Feedback", href: "/feedback" },
    { name: "Tutorial & Docs", href: "/tutorial" },
    { name: "Settings", href: "/settings" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="font-bold text-xl text-primary flex items-center gap-2">
              <Leaf className="h-6 w-6 text-emerald-500 animate-pulse" />
              <span className="font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-green-600">
                Stellar Carbon
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                className="text-sm font-medium hover:text-emerald-500 transition-colors text-muted-foreground hover:scale-105 transform duration-200"
              >
                {link.name}
              </Link>
            ))}

            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full w-9 h-9 text-muted-foreground hover:text-foreground"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
            </Button>
            
            {address ? (
              <div className="flex items-center gap-3">
                {balance !== null && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold">
                    {Number(balance).toLocaleString(undefined, { maximumFractionDigits: 4 })} XLM
                  </div>
                )}
                <div className="bg-muted border border-border px-3 py-1.5 rounded-full text-xs font-mono">
                  {address.slice(0, 4)}...{address.slice(-4)}
                </div>
                <Button variant="outline" size="sm" onClick={disconnect} className="rounded-full">
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button onClick={connect} disabled={isConnecting} className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>

          {/* Mobile menu button & Theme toggle */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full w-9 h-9 text-muted-foreground hover:text-foreground"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
            </Button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-muted focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-border/50 bg-background/95 backdrop-blur px-4 pt-2 pb-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium hover:text-emerald-500 hover:bg-muted transition-all"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-border/50">
            {address ? (
              <div className="flex flex-col gap-3 px-3">
                {balance !== null && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-md text-xs font-semibold text-center">
                    {balance} XLM
                  </div>
                )}
                <div className="bg-muted text-center py-2 rounded-md text-xs font-mono font-medium">
                  {address}
                </div>
                <Button variant="outline" size="sm" onClick={() => { disconnect(); setIsOpen(false); }} className="w-full">
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="px-3">
                <Button onClick={() => { connect(); setIsOpen(false); }} disabled={isConnecting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
