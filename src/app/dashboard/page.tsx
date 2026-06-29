"use client";

import { useState } from "react";
import { useAppStore } from "@/store";
import { useStellar } from "@/providers/StellarWalletProvider";
import { Button } from "@/components/ui/button";
import { 
  TransactionBuilder, 
  Horizon, 
  Operation, 
  Asset, 
  Address, 
  Contract,
  nativeToScVal, 
  rpc as StellarRpc, 
  Networks 
} from "@stellar/stellar-sdk";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { REGISTRY_CONTRACT_ID } from "@/lib/stellar";

export default function Dashboard() {
  const { address, balance, isFunding, fundWallet, refreshBalance } = useStellar();
  const projects = useAppStore((state) => state.projects);
  const addProject = useAppStore((state) => state.addProject);
  const addTransaction = useAppStore((state) => state.addTransaction);

  // Send XLM Form State
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [txMessage, setTxMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  // Register Project Form State
  const [newProjectId, setNewProjectId] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [regStatus, setRegStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [regMessage, setRegMessage] = useState("");
  const [regHash, setRegHash] = useState("");

  // Mint Credits Row Status State
  const [mintStatus, setMintStatus] = useState<
    Record<string, { status: "idle" | "loading" | "success" | "error"; message: string; hash?: string }>
  >({});

  // Error Parsing Utility
  const parseStellarError = (error: any, defaultContext: string) => {
    console.error("Parsing error:", error);
    
    // Type 1: User / Signature Rejection
    const isDeclined = 
      error?.message?.toLowerCase().includes("user declined") || 
      error?.message?.toLowerCase().includes("reject") ||
      error?.message?.toLowerCase().includes("declined") ||
      error?.message?.toLowerCase().includes("canceled") ||
      error?.code === -4; // Freighter declined code
    if (isDeclined) {
      return "Transaction signature was rejected in Freighter.";
    }

    // Type 2: Account Unfunded or Insufficient Balance
    if (error?.response?.status === 404 || error?.status === 404) {
      return "Your account is unfunded on Testnet. Please fund your account via Friendbot first.";
    }
    if (error?.response?.data?.extras?.result_codes?.transaction === "tx_insufficient_balance") {
      return "Insufficient XLM balance to cover the transaction amount and network fees.";
    }

    // Type 3: Contract Panic / Execution Simulation Failure
    if (error?.response?.data?.extras?.result_codes?.operations?.[0] === "op_malformed") {
      return "Transaction malformed. Please verify the contract address and inputs.";
    }
    
    // Try to extract Soroban RPC diagnostic message
    if (error?.message?.includes("Simulation failed")) {
      return `Simulation failed: The contract call rejected this input (e.g. project already exists or no credits to mint).`;
    }
    
    if (error?.response?.data?.detail) {
      return error.response.data.detail;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return `${defaultContext}. Please verify inputs and ensure Freighter is configured on Testnet.`;
  };

  // 1. Send XLM payment
  const handleSendXLM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !destination || !amount) return;

    setIsSending(true);
    setTxStatus("loading");
    setTxMessage("Preparing XLM transfer...");
    setTxHash("");

    try {
      const server = new Horizon.Server("https://horizon-testnet.stellar.org");
      
      setTxMessage("Step 1/5: Loading account sequence from Horizon...");
      const sourceAccount = await server.loadAccount(address);

      setTxMessage("Step 2/5: Building Classic payment operation...");
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: "1000",
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: destination.trim(),
            asset: Asset.native(),
            amount: amount.trim(),
          })
        )
        .setTimeout(60)
        .build();

      const xdr = transaction.toXDR();

      setTxMessage("Step 3/5: Awaiting signature in Freighter wallet...");
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address: address || undefined,
      });

      setTxMessage("Step 4/5: Submitting transaction to Testnet...");
      const txToSubmit = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);
      const result = await server.submitTransaction(txToSubmit);

      setTxHash(result.hash);
      setTxStatus("success");
      setTxMessage("Step 5/5: XLM transfer successfully confirmed on-chain!");
      setDestination("");
      setAmount("");

      // Log in Zustand store
      addTransaction({
        hash: result.hash,
        type: "Transfer",
        status: "Confirmed",
        timestamp: Date.now(),
        explorerLink: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      });

      await refreshBalance();
    } catch (error: any) {
      setTxStatus("error");
      setTxMessage(parseStellarError(error, "XLM Transfer failed"));
    } finally {
      setIsSending(false);
    }
  };

  // 2. Register Project (Soroban contract call)
  const handleRegisterProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !newProjectId) return;

    setIsRegistering(true);
    setRegStatus("loading");
    setRegMessage("Preparing Soroban contract call...");
    setRegHash("");

    try {
      if (!REGISTRY_CONTRACT_ID) {
        throw new Error("Contract ID is missing. Please check .env.local configuration.");
      }

      const rpcServer = new StellarRpc.Server("https://soroban-testnet.stellar.org");
      const contract = new Contract(REGISTRY_CONTRACT_ID);

      setRegMessage("Step 1/6: Fetching account sequence from Stellar RPC...");
      let sourceAccount;
      try {
        sourceAccount = await rpcServer.getAccount(address);
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.status === 404) {
          throw new Error("Your account is unfunded on Testnet. Please fund your account via Friendbot first.");
        }
        throw err;
      }

      setRegMessage("Step 2/6: Formatting contract arguments to ScVal...");
      const addressScVal = Address.fromString(address).toScVal();
      const projectIdScVal = nativeToScVal(newProjectId.trim(), { type: "string" });

      setRegMessage("Step 3/6: Building transaction envelope...");
      let transaction = new TransactionBuilder(sourceAccount, {
        fee: "100", 
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(contract.call("register_project", addressScVal, projectIdScVal))
        .setTimeout(60)
        .build();

      setRegMessage("Step 4/6: Simulating transaction to estimate footprint...");
      transaction = await rpcServer.prepareTransaction(transaction);

      setRegMessage("Step 5/6: Awaiting signature in Freighter wallet...");
      const xdr = transaction.toXDR();
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address: address || undefined,
      });

      setRegMessage("Step 6/6: Submitting registration to ledger...");
      const txToSubmit = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);
      const sendResponse = await rpcServer.sendTransaction(txToSubmit);

      if (sendResponse.status !== "PENDING") {
        throw new Error(`Transaction failed: ${sendResponse.status}`);
      }

      const hash = sendResponse.hash;
      setRegHash(hash);
      setRegMessage("Polling for ledger confirmation...");

      // Poll for transaction terminal status
      let getResponse;
      while (true) {
        getResponse = await rpcServer.getTransaction(hash);
        if (getResponse.status !== "NOT_FOUND") {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (getResponse.status === "SUCCESS") {
        setRegStatus("success");
        setRegMessage("Success! Project registered successfully on the Soroban smart contract.");
        
        // Add to Zustand projects list
        addProject({
          id: newProjectId.trim(),
          owner: address,
          verified_data: 5000, // Initialize with test data for Level 2 verification
          minted_credits: 0,
        });

        // Add to Zustand transaction center log
        addTransaction({
          hash: hash,
          type: "Register",
          status: "Confirmed",
          timestamp: Date.now(),
          explorerLink: `https://stellar.expert/explorer/testnet/tx/${hash}`,
        });

        setNewProjectId("");
        await refreshBalance();
      } else {
        throw new Error("Soroban execution failed. The contract Panicked (e.g. project already exists).");
      }
    } catch (error: any) {
      setRegStatus("error");
      setRegMessage(parseStellarError(error, "Project Registration failed"));
    } finally {
      setIsRegistering(false);
    }
  };

  // 3. Mint Credits (Soroban contract call)
  const handleMintCredits = async (projectId: string) => {
    setMintStatus((prev) => ({
      ...prev,
      [projectId]: { status: "loading", message: "Preparing Soroban mint..." }
    }));

    try {
      if (!REGISTRY_CONTRACT_ID) {
        throw new Error("Contract ID is missing.");
      }

      const rpcServer = new StellarRpc.Server("https://soroban-testnet.stellar.org");
      const contract = new Contract(REGISTRY_CONTRACT_ID);

      const sourceAccount = await rpcServer.getAccount(address!);
      const projectIdScVal = nativeToScVal(projectId, { type: "string" });

      let transaction = new TransactionBuilder(sourceAccount, {
        fee: "100",
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(contract.call("mint_credits", projectIdScVal))
        .setTimeout(60)
        .build();

      setMintStatus((prev) => ({
        ...prev,
        [projectId]: { status: "loading", message: "Simulating on-chain resource footprint..." }
      }));
      transaction = await rpcServer.prepareTransaction(transaction);

      setMintStatus((prev) => ({
        ...prev,
        [projectId]: { status: "loading", message: "Awaiting Freighter signature..." }
      }));
      const xdr = transaction.toXDR();
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address: address || undefined,
      });

      setMintStatus((prev) => ({
        ...prev,
        [projectId]: { status: "loading", message: "Submitting mint transaction..." }
      }));
      const txToSubmit = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);
      const sendResponse = await rpcServer.sendTransaction(txToSubmit);

      if (sendResponse.status !== "PENDING") {
        throw new Error(`Transaction failed: ${sendResponse.status}`);
      }

      const hash = sendResponse.hash;
      setMintStatus((prev) => ({
        ...prev,
        [projectId]: { status: "loading", message: "Waiting for ledger...", hash }
      }));

      // Poll
      let getResponse;
      while (true) {
        getResponse = await rpcServer.getTransaction(hash);
        if (getResponse.status !== "NOT_FOUND") {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (getResponse.status === "SUCCESS") {
        setMintStatus((prev) => ({
          ...prev,
          [projectId]: { status: "success", message: "Success! Carbon credits minted.", hash }
        }));

        // Update local store project state
        const proj = projects.find((p) => p.id === projectId);
        if (proj) {
          useAppStore.getState().updateProject(projectId, {
            minted_credits: proj.verified_data
          });
        }

        // Add to transactions
        addTransaction({
          hash: hash,
          type: "Mint",
          status: "Confirmed",
          timestamp: Date.now(),
          explorerLink: `https://stellar.expert/explorer/testnet/tx/${hash}`,
        });

        await refreshBalance();
      } else {
        throw new Error("Soroban mint transaction failed during execution.");
      }
    } catch (error: any) {
      const errMsg = parseStellarError(error, "Minting failed");
      setMintStatus((prev) => ({
        ...prev,
        [projectId]: { status: "error", message: errMsg }
      }));
    }
  };

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Connect Wallet to Access Dashboard</h2>
        <p className="text-muted-foreground mb-6">You need to connect your Freighter wallet to view and manage carbon credits.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">Connected Address: {address}</p>
        </div>
        <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-md font-mono">
          Registry Contract ID: {REGISTRY_CONTRACT_ID.slice(0, 8)}...{REGISTRY_CONTRACT_ID.slice(-8)}
        </div>
      </div>
      
      {/* Balance Card Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border bg-card space-y-4 shadow-sm">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">XLM Balance</h3>
            <p className="text-3xl font-bold text-emerald-500">{balance !== null ? balance : "Loading..."}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={fundWallet} 
              disabled={isFunding}
              className="w-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white border-emerald-500/20 font-semibold"
            >
              {isFunding ? "Funding..." : "Fund Account (Friendbot)"}
            </Button>
            <Button size="sm" variant="ghost" onClick={refreshBalance} title="Refresh balance">
              🔄
            </Button>
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-card shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Verified Data</h3>
          <p className="text-3xl font-bold">5,000 <span className="text-sm font-normal text-muted-foreground">kWh</span></p>
        </div>
        <div className="p-6 rounded-xl border bg-card shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Minted Credits (CCT)</h3>
          <p className="text-3xl font-bold text-emerald-500">3,000</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Forms column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Send XLM Card */}
          <div className="p-6 border rounded-xl bg-card shadow-sm space-y-4">
            <h3 className="text-xl font-bold">Send XLM (Testnet)</h3>
            <form onSubmit={handleSendXLM} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-muted-foreground">Destination Address</label>
                  <button
                    type="button"
                    onClick={() => setDestination(address)}
                    className="text-[10px] text-emerald-500 hover:underline"
                  >
                    Use My Address (Self)
                  </button>
                </div>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="G..."
                  required
                  className="w-full p-2.5 rounded-lg border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Amount (XLM)</label>
                <input
                  type="number"
                  step="0.0000001"
                  min="0.0000001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  required
                  className="w-full p-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isSending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isSending ? "Processing..." : "Send Transaction"}
              </Button>
            </form>

            {/* Feedback Section */}
            {txStatus !== "idle" && (
              <div className={`p-4 rounded-lg border text-xs ${
                txStatus === "loading" ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" :
                txStatus === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
              }`}>
                <p className="font-semibold capitalize mb-1">{txStatus} State:</p>
                <p className="break-words">{txMessage}</p>
                {txHash && (
                  <div className="mt-2 pt-2 border-t border-emerald-500/20">
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-500 hover:underline font-semibold flex items-center gap-1 font-mono"
                    >
                      Hash: {txHash.slice(0, 8)}...{txHash.slice(-8)} ↗
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Register Project Card */}
          <div className="p-6 border rounded-xl bg-card shadow-sm space-y-4">
            <div className="space-y-1">
              <h3 className="text-xl font-bold">Register Project</h3>
              <p className="text-xs text-muted-foreground">Call the Registry Smart Contract to enroll a new project.</p>
            </div>
            <form onSubmit={handleRegisterProject} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Unique Project ID</label>
                <input
                  type="text"
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  placeholder="e.g. solar_project_1"
                  required
                  className="w-full p-2.5 rounded-lg border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isRegistering ? "Processing..." : "Register on Soroban"}
              </Button>
            </form>

            {/* Register Feedback Section */}
            {regStatus !== "idle" && (
              <div className={`p-4 rounded-lg border text-xs ${
                regStatus === "loading" ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" :
                regStatus === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
              }`}>
                <p className="font-semibold capitalize mb-1">{regStatus} State:</p>
                <p className="break-words">{regMessage}</p>
                {regHash && (
                  <div className="mt-2 pt-2 border-t border-emerald-500/20">
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${regHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-500 hover:underline font-semibold flex items-center gap-1 font-mono"
                    >
                      Hash: {regHash.slice(0, 8)}...{regHash.slice(-8)} ↗
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Projects Table Column */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-xl font-bold">Your Projects</h3>
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Project ID</th>
                <th className="px-6 py-4 font-medium">Verified Data</th>
                <th className="px-6 py-4 font-medium">Minted Credits</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map((p) => {
                const status = mintStatus[p.id];
                const isLoading = status?.status === "loading";
                const isSuccess = status?.status === "success";
                const isError = status?.status === "error";

                return (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono">
                      <div>
                        {p.id}
                        {isSuccess && status.hash && (
                          <div className="text-[10px] text-emerald-500 mt-1">
                            <a 
                              href={p.id === 'proj_demo' ? 'https://stellar.expert/explorer/testnet' : `https://stellar.expert/explorer/testnet/tx/${status.hash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline font-mono"
                            >
                              Tx Hash: {status.hash.slice(0, 6)}...{status.hash.slice(-6)} ↗
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{p.verified_data.toLocaleString()} kWh</td>
                    <td className="px-6 py-4 text-emerald-500 font-medium">
                      {p.minted_credits.toLocaleString()} CCT
                    </td>
                    <td className="px-6 py-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          disabled={p.verified_data <= p.minted_credits || isLoading}
                          onClick={() => handleMintCredits(p.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {isLoading ? "Minting..." : "Mint Credits"}
                        </Button>
                      </div>

                      {/* Line Status Feedback */}
                      {status && status.status !== "idle" && (
                        <div className={`p-2 rounded text-[10px] max-w-[280px] break-words border ${
                          isLoading ? "bg-blue-500/10 border-blue-500/20 text-blue-600" :
                          isSuccess ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                          "bg-red-500/10 border-red-500/20 text-red-600"
                        }`}>
                          <span className="font-bold capitalize">{status.status}: </span>
                          {status.message}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  );
}
