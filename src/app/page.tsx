import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-8 text-center space-y-8 bg-gradient-to-b from-background to-background/50">
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
          Transparent, Verifiable Carbon Credits.
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          The next-generation carbon offset market powered by Soroban Smart Contracts. 
          Dynamic credits minted from real-world environmental data without the greenwashing.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/dashboard">
          <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold">
            Launch Dashboard
          </Button>
        </Link>
        <Link href="/transactions">
          <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold">
            View Live Ledger
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl text-left">
        <div className="p-6 border border-border rounded-xl bg-card/50 backdrop-blur shadow-sm">
          <div className="text-3xl mb-4">🌍</div>
          <h3 className="text-lg font-bold mb-2">Real-World Data</h3>
          <p className="text-sm text-muted-foreground">Credits are minted dynamically based on verified data from IoT sensors and satellite feeds.</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card/50 backdrop-blur shadow-sm">
          <div className="text-3xl mb-4">🔗</div>
          <h3 className="text-lg font-bold mb-2">Soroban Smart Contracts</h3>
          <p className="text-sm text-muted-foreground">Utilizes advanced inter-contract calls to securely manage the carbon token lifecycle.</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card/50 backdrop-blur shadow-sm">
          <div className="text-3xl mb-4">⚡</div>
          <h3 className="text-lg font-bold mb-2">Real-Time Verification</h3>
          <p className="text-sm text-muted-foreground">Event streaming ensures every transaction and carbon offset is instantly verifiable.</p>
        </div>
      </div>
    </div>
  );
}
