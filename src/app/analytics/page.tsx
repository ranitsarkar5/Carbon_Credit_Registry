"use client";

import { useAppStore } from "@/store";
import { BarChart3, TrendingUp, HelpCircle } from "lucide-react";

export default function Analytics() {
  const projects = useAppStore(state => state.projects);
  const totalVerified = projects.reduce((acc, p) => acc + p.verified_data, 0);
  const totalMinted = projects.reduce((acc, p) => acc + p.minted_credits, 0);

  // Fallback to sample data only if store has no projects to display
  const chartData = projects.length > 0 ? projects : [
    { id: 'Demo Solar', verified_data: 5000, minted_credits: 3000 },
    { id: 'Demo Wind', verified_data: 8000, minted_credits: 6000 },
    { id: 'Demo Hydro', verified_data: 4000, minted_credits: 4000 }
  ];

  const maxVal = Math.max(...chartData.map(d => Math.max(d.verified_data, d.minted_credits)), 1000);
  
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b pb-4">
        <BarChart3 className="h-8 w-8 text-emerald-500" />
        <div>
          <h1 className="text-3xl font-bold">Registry Analytics</h1>
          <p className="text-muted-foreground text-sm">Network-wide statistics for the Carbon Credit Registry.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Verified Data</h3>
          <p className="text-3xl font-extrabold text-foreground">{totalVerified.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">kWh</span></p>
        </div>
        <div className="p-6 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Minted (CCT)</h3>
          <p className="text-3xl font-extrabold text-emerald-500">{totalMinted.toLocaleString()} CCT</p>
        </div>
        <div className="p-6 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Registered Projects</h3>
          <p className="text-3xl font-extrabold text-foreground">{projects.length}</p>
        </div>
        <div className="p-6 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Auditors</h3>
          <p className="text-3xl font-extrabold text-foreground">1</p>
        </div>
      </div>

      {/* SVG Interactive Premium Chart */}
      <div className="p-6 border rounded-xl bg-card shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h3 className="text-lg font-bold">Project Comparison (Verified vs Minted)</h3>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-muted-foreground">Verified Energy (kWh)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-emerald-500 rounded" />
              <span className="text-muted-foreground">Minted Credits (CCT)</span>
            </div>
          </div>
        </div>

        <div className="relative h-64 w-full border border-border/50 rounded-lg p-4 bg-muted/20 flex flex-col justify-between">
          {/* Y Axis Grid lines */}
          <div className="absolute inset-x-0 top-4 bottom-12 flex flex-col justify-between pointer-events-none">
            <div className="border-t border-border/30 w-full" />
            <div className="border-t border-border/30 w-full" />
            <div className="border-t border-border/30 w-full" />
            <div className="border-t border-border/30 w-full" />
          </div>

          {/* SVG Visualizer */}
          <div className="relative flex-1 flex items-end justify-around pt-6 pb-2 px-6 z-10 gap-4 sm:gap-12">
            {chartData.map((data, index) => {
              const verifiedHeight = (data.verified_data / maxVal) * 100;
              const mintedHeight = (data.minted_credits / maxVal) * 100;
              
              return (
                <div key={index} className="flex-1 flex items-end justify-center h-full gap-2 group relative">
                  {/* Verified Bar */}
                  <div 
                    style={{ height: `${verifiedHeight}%` }} 
                    className="w-1/2 bg-blue-500 hover:bg-blue-600 rounded-t transition-all duration-500 shadow-sm relative group-hover:scale-x-105"
                  >
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-muted text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap border border-border">
                      {data.verified_data.toLocaleString()} kWh
                    </div>
                  </div>

                  {/* Minted Bar */}
                  <div 
                    style={{ height: `${mintedHeight}%` }} 
                    className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all duration-500 shadow-sm relative group-hover:scale-x-105"
                  >
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-muted text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap border border-border">
                      {data.minted_credits.toLocaleString()} CCT
                    </div>
                  </div>

                  {/* X Axis label */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-[10px] font-mono font-medium max-w-[80px] truncate text-center text-muted-foreground group-hover:text-foreground">
                    {data.id}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="h-6" /> {/* Axis spacing */}
        </div>
      </div>

      <div className="p-6 border rounded-xl bg-card shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-emerald-500" />
          <h3 className="text-lg font-bold">Why Verification Matters</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Standard carbon markets rely on manual verification reports issued months or years after carbon offsets have occurred. The Stellar Carbon Registry disrupts this model. By whitelisting IoT sensors and smart meters as contract Auditors, raw environmental metrics (such as kWh generated, trees planted) are pushed onto the blockchain. Smart contracts verify the data mathematically, ensuring 100% backing of every CCT token issued.
        </p>
      </div>
    </div>
  );
}
