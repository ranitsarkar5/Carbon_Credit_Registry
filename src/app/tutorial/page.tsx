"use client";

import { useState } from "react";
import { 
  BookOpen, 
  HelpCircle, 
  Wallet, 
  Send, 
  Cpu, 
  Coins, 
  ShieldCheck, 
  Terminal, 
  ArrowRight,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function TutorialPage() {
  const [activeTab, setActiveTab] = useState<"tutorial" | "architecture" | "testnet">("tutorial");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const steps = [
    {
      icon: <Wallet className="h-6 w-6 text-emerald-500" />,
      title: "1. Connect Freighter Wallet",
      description: "Install the Freighter browser extension, switch it to the Stellar Testnet network in settings, and click 'Connect Wallet' in the Navbar. Use the Friendbot button on the dashboard to automatically fund your address with testnet XLM."
    },
    {
      icon: <Send className="h-6 w-6 text-emerald-500" />,
      title: "2. Register Carbon Project",
      description: "Enter a unique Project ID (e.g. 'wind_farm_scandinavia') and submit the transaction. This registers you as the project owner in the Carbon Registry contract on-chain."
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />,
      title: "3. Whitelist Auditor (Admin Only)",
      description: "The registry administrator must authorize an auditor's address before they can report verified metrics. Only whitelisted auditors are permitted to submit real-world environmental data."
    },
    {
      icon: <Cpu className="h-6 w-6 text-emerald-500" />,
      title: "4. Report IoT / Oracle Telemetry",
      description: "The whitelisted auditor selects the project and enters the verified clean energy generated (kWh). When submitted, the auditor role signature authorizes writing this data directly to the project's contract storage."
    },
    {
      icon: <Coins className="h-6 w-6 text-emerald-500" />,
      title: "5. Mint Carbon Credit Tokens (CCT)",
      description: "As the project owner, click 'Mint Credits' on the dashboard. The Registry checks your verified data on-chain and triggers a cross-contract call to the CCT Token contract, minting SEP-41 tokens directly to your wallet."
    }
  ];

  const faqs = [
    {
      q: "What is a SEP-41 token?",
      a: "SEP-41 is the standard token interface for Soroban Smart Contracts on Stellar, equivalent to ERC-20 on Ethereum. It defines standard methods like name, symbol, decimals, balance, transfer, and allowance."
    },
    {
      q: "Why can't I mint carbon credits immediately?",
      a: "To prevent greenwashing and double-counting, you can only mint credits up to the amount of clean energy output verified by a whitelisted Auditor or sensor Oracle. (1 kWh = 1 Credit limit)."
    },
    {
      q: "How does cross-contract communication work here?",
      a: "When a project owner calls `mint_credits` on the CarbonRegistry contract, the registry performs a secure client invocation `client.mint(...)` targeting the address of the CarbonAsset token contract. The token contract verifies that the call originates from the Registry before minting."
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      {/* Title */}
      <div className="flex items-center gap-3 border-b pb-4">
        <BookOpen className="h-8 w-8 text-emerald-500" />
        <div>
          <h1 className="text-3xl font-bold">Documentation & Tutorial Guide</h1>
          <p className="text-muted-foreground text-sm">Everything you need to know about the Stellar Carbon Registry DApp, contracts, and architecture.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("tutorial")}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === "tutorial" ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          User Quick Start
        </button>
        <button
          onClick={() => setActiveTab("architecture")}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === "architecture" ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Smart Contract Architecture
        </button>
        <button
          onClick={() => setActiveTab("testnet")}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === "testnet" ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Stellar Testnet Guide
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-8">
        
        {/* TAB 1: USER TUTORIAL */}
        {activeTab === "tutorial" && (
          <div className="space-y-8">
            <div className="p-6 border rounded-xl bg-card shadow-sm space-y-4">
              <h2 className="text-xl font-bold">DApp Walkthrough</h2>
              <p className="text-sm text-muted-foreground">Follow these 5 steps to interact with the Stellar Carbon Registry on the testnet:</p>
              
              <div className="space-y-6 mt-6">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4 items-start p-4 border border-border/50 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="p-2.5 bg-emerald-500/10 rounded-lg shrink-0">
                      {step.icon}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-base text-foreground">{step.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div className="p-6 border rounded-xl bg-card shadow-sm space-y-4">
              <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
              <div className="divide-y divide-border">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="py-4 space-y-2">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex justify-between items-center text-left font-bold text-sm sm:text-base hover:text-emerald-500 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {expandedFaq === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {expandedFaq === idx && (
                      <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONTRACT ARCHITECTURE */}
        {activeTab === "architecture" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Side: Technical overview */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-6 border rounded-xl bg-card shadow-sm space-y-4">
                  <h2 className="text-xl font-bold">Smart Contract Architecture</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The Stellar Carbon Registry is a decentralized platform built with two interacting Soroban Smart Contracts. The design pattern ensures data verification integrity and strict mint limits on carbon tokens.
                  </p>
                  
                  {/* ASCII Diagram representation */}
                  <div className="p-4 bg-muted rounded-lg font-mono text-xs overflow-x-auto border space-y-1 leading-relaxed">
                    <p className="text-emerald-500 font-bold">// INTER-CONTRACT COMMUNICATION FLOW</p>
                    <p>1. [Auditor Oracle] --- (verify_data) ---&gt; [CarbonRegistryContract]</p>
                    <p>                                            |</p>
                    <p>                                     (checks storage key: Project)</p>
                    <p>                                            |</p>
                    <p>2. [Project Owner] --- (mint_credits) ------&gt; [CarbonRegistryContract]</p>
                    <p>                                            |</p>
                    <p>                                     (cross-contract call)</p>
                    <p>                                            v</p>
                    <p>3.                           [CarbonAssetContract (SEP-41)] ---&gt; [Project Owner Wallet (CCT)]</p>
                  </div>
                </div>

                <div className="p-6 border rounded-xl bg-card shadow-sm space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-emerald-500" />
                    Storage Keys & State (DataKey)
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The Registry contract stores project owners, auditor whitelists, and verified telemetry values inside persistent storage keys:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 leading-relaxed">
                    <li><code className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">DataKey::Admin</code>: Stores the administrative address who whitelists auditors (instance storage).</li>
                    <li><code className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">DataKey::AssetContract</code>: Address of the linked Carbon Asset contract (instance storage).</li>
                    <li><code className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">DataKey::Auditor(Address)</code>: Boolean tracking whitelisted oracle status (persistent storage).</li>
                    <li><code className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">DataKey::Project(String)</code>: The Project struct containing project owner address, accumulated verified data, and already minted credit amount (persistent storage).</li>
                  </ul>
                </div>
              </div>

              {/* Right Side: Contract Methods Reference */}
              <div className="lg:col-span-1 border rounded-xl p-6 bg-card shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Registry API Reference</h3>
                  <p className="text-xs text-muted-foreground mt-1">Rust implementation method signatures:</p>
                </div>
                
                <div className="space-y-4 font-mono text-[11px] leading-relaxed">
                  <div className="p-3 bg-muted rounded border border-border/50">
                    <p className="text-emerald-500 font-semibold">// Initialize system</p>
                    <p className="text-foreground mt-1 font-bold">pub fn initialize(env: Env, admin: Address, asset_contract: Address)</p>
                  </div>
                  <div className="p-3 bg-muted rounded border border-border/50">
                    <p className="text-emerald-500 font-semibold">// Whitelist Auditor</p>
                    <p className="text-foreground mt-1 font-bold">pub fn add_auditor(env: Env, auditor: Address)</p>
                  </div>
                  <div className="p-3 bg-muted rounded border border-border/50">
                    <p className="text-emerald-500 font-semibold">// Register Project</p>
                    <p className="text-foreground mt-1 font-bold">pub fn register_project(env: Env, owner: Address, project_id: String)</p>
                  </div>
                  <div className="p-3 bg-muted rounded border border-border/50">
                    <p className="text-emerald-500 font-semibold">// Verify Telemetry Data</p>
                    <p className="text-foreground mt-1 font-bold">pub fn verify_data(env: Env, auditor: Address, project_id: String, amount: i128)</p>
                  </div>
                  <div className="p-3 bg-muted rounded border border-border/50">
                    <p className="text-emerald-500 font-semibold">// Cross-contract mint CCT</p>
                    <p className="text-foreground mt-1 font-bold">pub fn mint_credits(env: Env, project_id: String)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STELLAR TESTNET GUIDE */}
        {activeTab === "testnet" && (
          <div className="space-y-8">
            <div className="p-6 border rounded-xl bg-card shadow-sm space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Info className="h-5 w-5 text-emerald-500" />
                Interacting with Stellar Testnet
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 border rounded-lg bg-muted/20 space-y-3">
                  <h3 className="font-bold text-base">1. Freighter Configuration</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Freighter is the default wallet extension. Open settings, click on 'Network Connection', and select **Test Network** to ensure transaction request hashes compile with the proper SDF network passphrase.
                  </p>
                </div>
                
                <div className="p-5 border rounded-lg bg-muted/20 space-y-3">
                  <h3 className="font-bold text-base">2. Acquiring XLM (Friendbot)</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Stellar requires base reserves to fund ledger entry storage fees. You can fund your address with 10,000 testnet XLM instantly via our dashboard's Friendbot button or using the laboratory.
                  </p>
                  <a 
                    href="https://laboratory.stellar.org/#create-account" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 hover:underline"
                  >
                    Stellar Lab Creator <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                
                <div className="p-5 border rounded-lg bg-muted/20 space-y-3">
                  <h3 className="font-bold text-base">3. Verifying Transactions</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Use Stellar Expert explorer to inspect smart contract states. Search for your project ID string or transaction hash to verify parameters and see emitted events.
                  </p>
                  <a 
                    href="https://stellar.expert/explorer/testnet" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 hover:underline"
                  >
                    Stellar Expert Testnet <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 border rounded-xl bg-card shadow-sm space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Terminal className="h-5 w-5 text-emerald-500" />
                Useful Stellar CLI Commands
              </h2>
              <p className="text-sm text-muted-foreground">For advanced developers running tests or invoking contracts from local terminals:</p>
              
              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 bg-muted rounded border border-border/50">
                  <p className="text-muted-foreground"># Install smart contract CLI tool</p>
                  <p className="text-foreground font-bold mt-1">cargo install --locked stellar-cli</p>
                </div>
                <div className="p-4 bg-muted rounded border border-border/50">
                  <p className="text-muted-foreground"># Build contract WASM binaries</p>
                  <p className="text-foreground font-bold mt-1">cargo build --target wasm32-unknown-unknown --release</p>
                </div>
                <div className="p-4 bg-muted rounded border border-border/50">
                  <p className="text-muted-foreground"># Deploy registry contract to testnet</p>
                  <p className="text-foreground font-bold mt-1">stellar contract deploy --wasm target/wasm32-unknown-unknown/release/carbon_registry.wasm --source deployer --network testnet</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
