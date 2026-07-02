import { 
  Contract, 
  Address, 
  rpc as StellarRpc, 
  scValToNative, 
  nativeToScVal, 
  TransactionBuilder, 
  Networks,
  Account
} from "@stellar/stellar-sdk";

export const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";

export const REGISTRY_CONTRACT_ID = process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ID || "";
export const ASSET_CONTRACT_ID = process.env.NEXT_PUBLIC_ASSET_CONTRACT_ID || "";

const rpcServer = new StellarRpc.Server(SOROBAN_RPC_URL);

// Helper to simulate a read-only contract call
async function simulateCall(method: string, ...args: any[]) {
  if (!REGISTRY_CONTRACT_ID) {
    console.warn("Registry Contract ID is not configured.");
    return null;
  }
  try {
    const contract = new Contract(REGISTRY_CONTRACT_ID);
    
    // Standard testnet dummy address to execute simulation
    const dummyAddress = "GD6W5F6NMXMIOO5M2NWEX6DUMCUBHCAYV7I5GSC55A3JZXGZPX4E2SXY"; 
    
    let sourceAccount;
    try {
      sourceAccount = await rpcServer.getAccount(dummyAddress);
    } catch {
      // Fallback: create a temporary account instance if account not found on ledger
      sourceAccount = new Account(dummyAddress, "0");
    }

    const tx = new TransactionBuilder(sourceAccount, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const simResponse = await rpcServer.simulateTransaction(tx);
    if (StellarRpc.Api.isSimulationSuccess(simResponse) && simResponse.result) {
      return scValToNative(simResponse.result.retval);
    }
  } catch (error) {
    console.error(`Error simulating call to ${method}:`, error);
  }
  return null;
}

export async function getProject(projectId: string) {
  const result = await simulateCall("get_project", nativeToScVal(projectId, { type: "string" }));
  if (!result) return null;
  return {
    id: projectId,
    owner: result.owner,
    verified_data: Number(result.verified_data),
    minted_credits: Number(result.minted_credits),
  };
}

export async function isAuditor(address: string): Promise<boolean> {
  if (!address) return false;
  try {
    const addressScVal = Address.fromString(address).toScVal();
    const result = await simulateCall("is_auditor", addressScVal);
    return !!result;
  } catch (e) {
    console.error("Error checking auditor:", e);
    return false;
  }
}

export async function getAdmin(): Promise<string | null> {
  const result = await simulateCall("get_admin");
  return result ? String(result) : null;
}

export async function fetchContractEvents(contractId: string) {
  if (!contractId) return [];
  try {
    const latestLedgerRes = await rpcServer.getLatestLedger();
    const latestLedger = latestLedgerRes.sequence;
    
    // Fetch events from last 20,000 ledgers (approx 27 hours)
    const startLedger = Math.max(1, latestLedger - 20000);
    
    const response = await rpcServer.getEvents({
      startLedger: startLedger,
      filters: [
        {
          type: "contract",
          contractIds: [contractId],
        },
      ],
      limit: 50,
    });
    
    return response.events.map((event) => {
      const topics = event.topic.map((t) => scValToNative(t));
      const value = scValToNative(event.value);
      
      let type: 'Register' | 'Verify' | 'Mint' | 'Retire' | 'Transfer' = 'Transfer';
      if (topics[0] === "project" && topics[1] === "register") type = "Register";
      if (topics[0] === "data" && topics[1] === "verify") type = "Verify";
      if (topics[0] === "credits" && topics[1] === "mint") type = "Mint";
      
      return {
        hash: event.txHash,
        type,
        status: "Confirmed" as const,
        timestamp: Date.parse(event.ledgerClosedAt) || Date.now(),
        explorerLink: `https://stellar.expert/explorer/testnet/tx/${event.txHash}`,
        details: Array.isArray(value) ? value.map(v => String(v)).join(", ") : String(value),
      };
    });
  } catch (error) {
    console.error("Failed to fetch contract events:", error);
    return [];
  }
}
