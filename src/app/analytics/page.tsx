"use client";

import { useAppStore } from "@/store";

export default function Analytics() {
  const projects = useAppStore(state => state.projects);
  const totalVerified = projects.reduce((acc, p) => acc + p.verified_data, 0);
  const totalMinted = projects.reduce((acc, p) => acc + p.minted_credits, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Registry Analytics</h1>
      <p className="text-muted-foreground">Network-wide statistics for the Carbon Credit Registry.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-xl border bg-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Verified Data</h3>
          <p className="text-3xl font-bold">{totalVerified.toLocaleString()} <span className="text-sm font-normal">kWh</span></p>
        </div>
        <div className="p-6 rounded-xl border bg-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Minted (CCT)</h3>
          <p className="text-3xl font-bold text-green-500">{totalMinted.toLocaleString()}</p>
        </div>
        <div className="p-6 rounded-xl border bg-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Registered Projects</h3>
          <p className="text-3xl font-bold">{projects.length}</p>
        </div>
        <div className="p-6 rounded-xl border bg-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Auditors</h3>
          <p className="text-3xl font-bold">1</p>
        </div>
      </div>

      <div className="mt-12 p-8 border rounded-xl bg-card text-center">
        <h3 className="text-lg font-semibold mb-2">Impact Visualization</h3>
        <p className="text-muted-foreground mb-4">Connect a visualization tool like Grafana or Hubble to view advanced time-series data for the registry.</p>
        <div className="h-48 bg-muted rounded-lg flex items-center justify-center border border-dashed">
          Chart Placeholder
        </div>
      </div>
    </div>
  );
}
