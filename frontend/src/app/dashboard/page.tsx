"use client";

import { useAppStore } from "@/store";
import { useStellar } from "@/providers/StellarWalletProvider";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { address } = useStellar();
  const projects = useAppStore((state) => state.projects);

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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Dashboard</h1>
        <Button variant="outline">Register New Project</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-xl border bg-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Verified Data</h3>
          <p className="text-3xl font-bold">5,000 <span className="text-sm font-normal text-muted-foreground">kWh</span></p>
        </div>
        <div className="p-6 rounded-xl border bg-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Minted Credits (CCT)</h3>
          <p className="text-3xl font-bold text-green-500">3,000</p>
        </div>
        <div className="p-6 rounded-xl border bg-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Available to Mint</h3>
          <p className="text-3xl font-bold text-blue-500">2,000</p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Your Projects</h2>
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Project ID</th>
                <th className="px-6 py-4 font-medium">Verified Data</th>
                <th className="px-6 py-4 font-medium">Minted Credits</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map(p => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-mono">{p.id}</td>
                  <td className="px-6 py-4">{p.verified_data.toLocaleString()}</td>
                  <td className="px-6 py-4 text-green-500 font-medium">{p.minted_credits.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <Button size="sm" disabled={p.verified_data <= p.minted_credits}>
                      Mint Credits
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
