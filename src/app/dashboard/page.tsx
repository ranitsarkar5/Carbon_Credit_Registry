"use client";

import { useState, useEffect, useCallback } from "react";
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
import { REGISTRY_CONTRACT_ID, getProject, isAuditor, getAdmin, SOROBAN_RPC_URL } from "@/lib/stellar";
import { 
  ShieldCheck, 
  UserCheck, 
  PlusCircle, 
  CheckCircle, 
  AlertTriangle, 
  Cpu,
  RefreshCw,
  Coins,
  Send,
  Building,
  User,
  Activity
} from "lucide-react";

export default function Dashboard() {
  const { address, balance, isFunding, fundWallet, refreshBalance } = useStellar();
  const projects = useAppStore((state) => state.projects);
  const addProject = useAppStore((state) => state.addProject);
  const addTransaction = useAppStore((state) => state.addTransaction);

  // Admin & Auditor roles
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUserAuditor, setIsUserAuditor] = useState(false);
  const [adminAddress, setAdminAddress] = useState<string | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

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

  // Admin Panel Form State (Add Auditor)
  const [newAuditorAddress, setNewAuditorAddress] = useState("");
  const [isAddingAuditor, setIsAddingAuditor] = useState(false);
  const [auditorStatus, setAuditorStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [auditorMessage, setAuditorMessage] = useState("");
  const [auditorHash, setAuditorHash] = useState("");

  // Auditor Panel Form State (Verify Data)
  const [verifyProjectId, setVerifyProjectId] = useState("");
  const [verifyAmount, setVerifyAmount] = useState("");
  const [isVerifyingData, setIsVerifyingData] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifyHash, setVerifyHash] = useState("");

  // Mint Credits Row Status State
  const [mintStatus, setMintStatus] = useState<
    Record<string, { status: "idle" | "loading" | "success" | "error"; message: string; hash?: string }>
  >({});

  // Sync projects details with on-chain smart contract state
  const syncProjects = useCallback(async (showNotification = false) => {
    if (projects.length === 0) return;
    setIsSyncing(true);
    try {
      for (const p of projects) {
        // Skip default demo project unless deployed
        if (p.id === "proj_demo") continue;
        const onChain = await getProject(p.id);
        if (onChain) {
          useAppStore.getState().updateProject(p.id, {
            verified_data: onChain.verified_data,
            minted_credits: onChain.minted_credits,
            owner: onChain.owner
          });
        }
      }
      if (showNotification) {
        console.log("Projects successfully synchronized with Stellar Testnet.");
      }
    } catch (e) {
      console.error("Error syncing projects:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [projects]);

  // Load Admin and Auditor status on wallet connection
  useEffect(() => {
    async function loadRoles() {
      if (!address) {
        setIsAdmin(false);
        setIsUserAuditor(false);
        setAdminAddress(null);
        return;
      }
      try {
        const admin = await getAdmin();
        setAdminAddress(admin);
        if (admin && address.toLowerCase() === admin.toLowerCase()) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }

        const auditorCheck = await isAuditor(address);
        setIsUserAuditor(auditorCheck);
      } catch (err) {
        console.error("Failed to fetch system roles:", err);
      }
    }
    loadRoles();
  }, [address]);

  // Auto-sync projects on initialization
  useEffect(() => {
    if (address && projects.length > 0) {
      syncProjects(false);
    }
  }, [address, syncProjects]);

  // Error Parsing Utility
  const parseStellarError = (error: any, defaultContext: string) => {
    console.error("Parsing error details:", error);
    
    const isDeclined = 
      error?.message?.toLowerCase().includes("user declined") || 
      error?.message?.toLowerCase().includes("reject") ||
      error?.message?.toLowerCase().includes("declined") ||
      error?.message?.toLowerCase().includes("canceled") ||
      error?.code === -4;
    if (isDeclined) {
      return "Transaction signature was rejected in Freighter.";
    }

    if (error?.response?.status === 404 || error?.status === 404) {
      return "Your account is unfunded on Testnet. Please fund your account via Friendbot first.";
    }
    if (error?.response?.data?.extras?.result_codes?.transaction === "tx_insufficient_balance") {
      return "Insufficient XLM balance to cover the transaction amount and network fees.";
    }

    if (error?.response?.data?.extras?.result_codes?.operations?.[0] === "op_malformed") {
      return "Transaction malformed. Please verify the contract address and inputs.";
    }
    
    if (error?.message?.includes("Simulation failed")) {
      return `Simulation failed: The contract rejected this call. Ensure project exists, auditor is whitelisted, or you have authorization.`;
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
        throw new Error("Contract ID is missing. Please check configuration.");
      }

      const rpcServer = new StellarRpc.Server(SOROBAN_RPC_URL);
      const contract = new Contract(REGISTRY_CONTRACT_ID);

      setRegMessage("Step 1/6: Fetching account sequence from Stellar RPC...");
      const sourceAccount = await rpcServer.getAccount(address);

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
        
        addProject({
          id: newProjectId.trim(),
          owner: address,
          verified_data: 0,
          minted_credits: 0,
        });

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

  // 3. Admin Function: Whitelist Auditor
  const handleAddAuditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !newAuditorAddress) return;

    setIsAddingAuditor(true);
    setAuditorStatus("loading");
    setAuditorMessage("Preparing add auditor call...");
    setAuditorHash("");

    try {
      if (!REGISTRY_CONTRACT_ID) {
        throw new Error("Registry contract ID is missing.");
      }

      const rpcServer = new StellarRpc.Server(SOROBAN_RPC_URL);
      const contract = new Contract(REGISTRY_CONTRACT_ID);

      setAuditorMessage("Step 1/6: Loading account details...");
      const sourceAccount = await rpcServer.getAccount(address);

      setAuditorMessage("Step 2/6: Formatting parameters...");
      const auditorScVal = Address.fromString(newAuditorAddress.trim()).toScVal();

      setAuditorMessage("Step 3/6: Building transaction...");
      let transaction = new TransactionBuilder(sourceAccount, {
        fee: "100",
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(contract.call("add_auditor", auditorScVal))
        .setTimeout(60)
        .build();

      setAuditorMessage("Step 4/6: Simulating on-chain resource footprint...");
      transaction = await rpcServer.prepareTransaction(transaction);

      setAuditorMessage("Step 5/6: Awaiting administrator approval in Freighter...");
      const xdr = transaction.toXDR();
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address: address || undefined,
      });

      setAuditorMessage("Step 6/6: Submitting auditor to ledger...");
      const txToSubmit = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);
      const sendResponse = await rpcServer.sendTransaction(txToSubmit);

      if (sendResponse.status !== "PENDING") {
        throw new Error(`Transaction failed: ${sendResponse.status}`);
      }

      const hash = sendResponse.hash;
      setAuditorHash(hash);
      setAuditorMessage("Polling for confirmation...");

      let getResponse;
      while (true) {
        getResponse = await rpcServer.getTransaction(hash);
        if (getResponse.status !== "NOT_FOUND") {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (getResponse.status === "SUCCESS") {
        setAuditorStatus("success");
        setAuditorMessage(`Successfully authorized auditor: ${newAuditorAddress}`);
        setNewAuditorAddress("");

        addTransaction({
          hash: hash,
          type: "Transfer", // Admin/Auditor update logged as transaction
          status: "Confirmed",
          timestamp: Date.now(),
          explorerLink: `https://stellar.expert/explorer/testnet/tx/${hash}`,
        });
      } else {
        throw new Error("Add Auditor transaction failed on execution.");
      }
    } catch (error: any) {
      setAuditorStatus("error");
      setAuditorMessage(parseStellarError(error, "Whitelisting auditor failed"));
    } finally {
      setIsAddingAuditor(false);
    }
  };

  // 4. Auditor/Oracle Function: Verify Project Data
  const handleVerifyData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !verifyProjectId || !verifyAmount) return;

    setIsVerifyingData(true);
    setVerifyStatus("loading");
    setVerifyMessage("Preparing data verification call...");
    setVerifyHash("");

    try {
      if (!REGISTRY_CONTRACT_ID) {
        throw new Error("Registry contract ID is missing.");
      }

      const rpcServer = new StellarRpc.Server(SOROBAN_RPC_URL);
      const contract = new Contract(REGISTRY_CONTRACT_ID);

      setVerifyMessage("Step 1/6: Loading account details...");
      const sourceAccount = await rpcServer.getAccount(address);

      setVerifyMessage("Step 2/6: Formatting parameters...");
      const auditorScVal = Address.fromString(address).toScVal();
      const projIdScVal = nativeToScVal(verifyProjectId.trim(), { type: "string" });
      const amountScVal = nativeToScVal(BigInt(verifyAmount.trim()), { type: "i128" });

      setVerifyMessage("Step 3/6: Building transaction...");
      let transaction = new TransactionBuilder(sourceAccount, {
        fee: "100",
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(contract.call("verify_data", auditorScVal, projIdScVal, amountScVal))
        .setTimeout(60)
        .build();

      setVerifyMessage("Step 4/6: Simulating resource footprint...");
      transaction = await rpcServer.prepareTransaction(transaction);

      setVerifyMessage("Step 5/6: Sign data transmission in Freighter...");
      const xdr = transaction.toXDR();
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address: address || undefined,
      });

      setVerifyMessage("Step 6/6: Sending verified clean energy metric on-chain...");
      const txToSubmit = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);
      const sendResponse = await rpcServer.sendTransaction(txToSubmit);

      if (sendResponse.status !== "PENDING") {
        throw new Error(`Transaction failed: ${sendResponse.status}`);
      }

      const hash = sendResponse.hash;
      setVerifyHash(hash);
      setVerifyMessage("Confirming verified data ledger record...");

      let getResponse;
      while (true) {
        getResponse = await rpcServer.getTransaction(hash);
        if (getResponse.status !== "NOT_FOUND") {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (getResponse.status === "SUCCESS") {
        setVerifyStatus("success");
        setVerifyMessage(`Clean energy data successfully verified and added to registry!`);
        
        // Sync local projects
        const proj = projects.find(p => p.id === verifyProjectId.trim());
        if (proj) {
          useAppStore.getState().updateProject(verifyProjectId.trim(), {
            verified_data: proj.verified_data + Number(verifyAmount)
          });
        }

        addTransaction({
          hash: hash,
          type: "Verify",
          status: "Confirmed",
          timestamp: Date.now(),
          explorerLink: `https://stellar.expert/explorer/testnet/tx/${hash}`,
        });

        setVerifyProjectId("");
        setVerifyAmount("");
      } else {
        throw new Error("Data verification transaction failed on execution.");
      }
    } catch (error: any) {
      setVerifyStatus("error");
      setVerifyMessage(parseStellarError(error, "Verifying data failed"));
    } finally {
      setIsVerifyingData(false);
    }
  };

  // 5. Mint Credits (Soroban contract call)
  const handleMintCredits = async (projectId: string) => {
    setMintStatus((prev) => ({
      ...prev,
      [projectId]: { status: "loading", message: "Preparing Soroban mint..." }
    }));

    try {
      if (!REGISTRY_CONTRACT_ID) {
        throw new Error("Contract ID is missing.");
      }

      const rpcServer = new StellarRpc.Server(SOROBAN_RPC_URL);
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
        [projectId]: { status: "loading", message: "Simulating resource footprint..." }
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

        const proj = projects.find((p) => p.id === projectId);
        if (proj) {
          useAppStore.getState().updateProject(projectId, {
            minted_credits: proj.verified_data
          });
        }

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
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] max-w-lg mx-auto space-y-4">
        <div className="text-6xl animate-bounce">🌱</div>
        <h2 className="text-2xl font-bold">Connect Wallet to Access Dashboard</h2>
        <p className="text-muted-foreground text-sm">
          You need to connect your Freighter browser wallet to view carbon projects, mint credits, and submit verified environmental data on Stellar.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Your Dashboard</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs break-all">
            Connected Wallet: <span className="text-foreground">{address}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => syncProjects(true)}
            disabled={isSyncing}
            className="flex items-center gap-1.5 rounded-full"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing Ledger..." : "Sync Projects"}
          </Button>
          <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full font-mono font-semibold">
            Registry Contract: {REGISTRY_CONTRACT_ID.slice(0, 6)}...{REGISTRY_CONTRACT_ID.slice(-6)}
          </div>
        </div>
      </div>
      
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border bg-card space-y-4 shadow-sm hover:shadow-md transition-all">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">XLM Balance</h3>
            <p className="text-3xl font-extrabold text-emerald-500">{balance !== null ? balance : "Loading..."}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={fundWallet} 
              disabled={isFunding}
              className="w-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white border-emerald-500/20 font-semibold rounded-lg"
            >
              {isFunding ? "Funding..." : "Fund Account (Friendbot)"}
            </Button>
            <Button size="sm" variant="ghost" onClick={refreshBalance} title="Refresh balance" className="rounded-lg">
              🔄
            </Button>
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Verified Data</h3>
            <p className="text-3xl font-extrabold">
              {projects.reduce((acc, p) => acc + p.verified_data, 0).toLocaleString()}{" "}
              <span className="text-sm font-normal text-muted-foreground">kWh</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Verified green energy output recorded by contract Oracles.</p>
        </div>

        <div className="p-6 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Minted Credits (CCT)</h3>
            <p className="text-3xl font-extrabold text-emerald-500">
              {projects.reduce((acc, p) => acc + p.minted_credits, 0).toLocaleString()}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Carbon Credit Tokens minted directly to project wallets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Interactions */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Admin Panel (Whitelist Auditor) */}
          {isAdmin && (
            <div className="p-6 border-2 border-red-500/20 rounded-xl bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-red-500">
                <ShieldCheck className="h-5 w-5" />
                <h3 className="text-lg font-bold">Admin Panel: Whitelist Auditor</h3>
              </div>
              <form onSubmit={handleAddAuditor} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Auditor Address (Stellar G...)</label>
                  <input
                    type="text"
                    value={newAuditorAddress}
                    onChange={(e) => setNewAuditorAddress(e.target.value)}
                    placeholder="G..."
                    required
                    className="w-full p-2.5 rounded-lg border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isAddingAuditor}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs"
                >
                  {isAddingAuditor ? "Adding Auditor..." : "Authorize Auditor"}
                </Button>
              </form>

              {auditorStatus !== "idle" && (
                <div className={`p-4 rounded-lg border text-xs ${
                  auditorStatus === "loading" ? "bg-blue-500/10 border-blue-500/20 text-blue-600" :
                  auditorStatus === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                  "bg-red-500/10 border-red-500/20 text-red-600"
                }`}>
                  <p className="break-words">{auditorMessage}</p>
                </div>
              )}
            </div>
          )}

          {/* Auditor Panel (Verify Project Data) */}
          {isUserAuditor && (
            <div className="p-6 border-2 border-blue-500/20 rounded-xl bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-blue-500">
                <Cpu className="h-5 w-5 animate-pulse" />
                <h3 className="text-lg font-bold">Auditor Panel: Report IoT Data</h3>
              </div>
              <form onSubmit={handleVerifyData} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Project ID</label>
                  <select
                    value={verifyProjectId}
                    onChange={(e) => setVerifyProjectId(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-lg border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.id}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Clean Energy Generated (kWh)</label>
                  <input
                    type="number"
                    min="1"
                    value={verifyAmount}
                    onChange={(e) => setVerifyAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    required
                    className="w-full p-2.5 rounded-lg border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isVerifyingData}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs"
                >
                  {isVerifyingData ? "Submitting Data..." : "Submit Clean Data"}
                </Button>
              </form>

              {verifyStatus !== "idle" && (
                <div className={`p-4 rounded-lg border text-xs ${
                  verifyStatus === "loading" ? "bg-blue-500/10 border-blue-500/20 text-blue-600" :
                  verifyStatus === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                  "bg-red-500/10 border-red-500/20 text-red-600"
                }`}>
                  <p className="break-words">{verifyMessage}</p>
                </div>
              )}
            </div>
          )}

          {/* Standard Register Project */}
          <div className="p-6 border rounded-xl bg-card shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <Building className="h-5 w-5" />
              <h3 className="text-lg font-bold">Register Carbon Project</h3>
            </div>
            <form onSubmit={handleRegisterProject} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Unique Project ID</label>
                <input
                  type="text"
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  placeholder="e.g. wind_farm_tx_4"
                  required
                  className="w-full p-2.5 rounded-lg border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
              >
                {isRegistering ? "Registering on Soroban..." : "Register Project"}
              </Button>
            </form>

            {regStatus !== "idle" && (
              <div className={`p-4 rounded-lg border text-xs ${
                regStatus === "loading" ? "bg-blue-500/10 border-blue-500/20 text-blue-600" :
                regStatus === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                "bg-red-500/10 border-red-500/20 text-red-600"
              }`}>
                <p className="break-words">{regMessage}</p>
                {regHash && (
                  <div className="mt-2 pt-2 border-t border-emerald-500/20">
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${regHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-500 hover:underline font-mono"
                    >
                      Tx: {regHash.slice(0, 8)}...{regHash.slice(-8)} ↗
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Send XLM Card */}
          <div className="p-6 border rounded-xl bg-card shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <Send className="h-5 w-5" />
              <h3 className="text-lg font-bold">Transfer XLM</h3>
            </div>
            <form onSubmit={handleSendXLM} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Destination Wallet (Stellar G...)</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="G..."
                  required
                  className="w-full p-2.5 rounded-lg border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Amount (XLM)</label>
                <input
                  type="number"
                  step="0.000001"
                  min="0.000001"
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
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
              >
                {isSending ? "Sending XLM..." : "Transfer XLM"}
              </Button>
            </form>

            {txStatus !== "idle" && (
              <div className={`p-4 rounded-lg border text-xs ${
                txStatus === "loading" ? "bg-blue-500/10 border-blue-500/20 text-blue-600" :
                txStatus === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                "bg-red-500/10 border-red-500/20 text-red-600"
              }`}>
                <p className="break-words">{txMessage}</p>
                {txHash && (
                  <div className="mt-2 pt-2 border-t border-emerald-500/20">
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-500 hover:underline font-mono"
                    >
                      Tx: {txHash.slice(0, 8)}...{txHash.slice(-8)} ↗
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Projects List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-500" />
              Registered Carbon Projects
            </h3>
            {isSyncing && <span className="text-xs text-muted-foreground animate-pulse">Syncing on-chain metrics...</span>}
          </div>
          
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground border-b text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Project ID</th>
                    <th className="px-6 py-4">On-Chain Owner</th>
                    <th className="px-6 py-4 text-right">Verified Data</th>
                    <th className="px-6 py-4 text-right">Minted Credits</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {projects.map((p) => {
                    const status = mintStatus[p.id];
                    const isLoading = status?.status === "loading";
                    const isSuccess = status?.status === "success";
                    const isOwner = address && p.owner && address.toLowerCase() === p.owner.toLowerCase();
                    const mintable = p.verified_data - p.minted_credits;

                    return (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-xs max-w-[120px] truncate">
                          {p.id}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs max-w-[140px] truncate text-muted-foreground" title={p.owner}>
                          {p.owner === 'GBL...ABCD' ? 'GBL...ABCD (Demo)' : p.owner ? `${p.owner.slice(0, 6)}...${p.owner.slice(-6)}` : 'None'}
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          {p.verified_data.toLocaleString()} kWh
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-500 font-bold">
                          {p.minted_credits.toLocaleString()} CCT
                        </td>
                        <td className="px-6 py-4 space-y-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              size="sm" 
                              disabled={mintable <= 0 || isLoading || !isOwner}
                              onClick={() => handleMintCredits(p.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-full px-4"
                            >
                              {isLoading ? "Minting..." : "Mint Credits"}
                            </Button>
                          </div>

                          {!isOwner && p.id !== 'proj_demo' && (
                            <p className="text-[10px] text-muted-foreground italic text-center">Only owner can mint</p>
                          )}

                          {status && status.status !== "idle" && (
                            <div className={`p-2 rounded text-[10px] max-w-[200px] break-words border mx-auto ${
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
            
            {projects.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No carbon projects registered. Use the project registration form to deploy a project.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
