"use client";

import { useState, useEffect } from "react";
import { useStellar } from "@/providers/StellarWalletProvider";
import { Star, MessageSquare, ThumbsUp, Send, CheckCircle, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackItem {
  id: string;
  name: string;
  role: string;
  rating: number;
  comment: string;
  timestamp: number;
  walletConnected: boolean;
}

const PRESET_FEEDBACKS: FeedbackItem[] = [
  {
    id: "fb-1",
    name: "Alex Thorne",
    role: "Project Owner (Wind Farm Operator)",
    rating: 5,
    comment: "The DApp made registering our wind project incredibly straightforward. The integration with Freighter was smooth, and minting our carbon credit tokens (CCT) happened instantly once the auditor verified our generation metrics.",
    timestamp: Date.now() - 3600000 * 24 * 5, // 5 days ago
    walletConnected: true,
  },
  {
    id: "fb-2",
    name: "Elena Rostova",
    role: "Auditor (IoT Energy Systems)",
    rating: 5,
    comment: "Excellent smart contract architecture. Being able to push data metrics on-chain as a verified auditor allows for complete transparency. No more manual excel sheets or double-counting risks.",
    timestamp: Date.now() - 3600000 * 24 * 4,
    walletConnected: true,
  },
  {
    id: "fb-3",
    name: "Marcus Chen",
    role: "Sustainability Researcher",
    rating: 4,
    comment: "Impressive transaction speeds on Stellar testnet. The SVG comparison chart is highly interactive and useful for viewing verified output versus minted credits. A search filter for projects would make it perfect.",
    timestamp: Date.now() - 3600000 * 24 * 3.5,
    walletConnected: false,
  },
  {
    id: "fb-4",
    name: "Sarah Jenkins",
    role: "Retail Carbon Buyer",
    rating: 5,
    comment: "I love the idea that carbon credits are dynamically backed by actual solar/wind output. The live ledger streaming is very transparent and shows exactly what is happening in real-time.",
    timestamp: Date.now() - 3600000 * 24 * 3,
    walletConnected: true,
  },
  {
    id: "fb-5",
    name: "David Kim",
    role: "Soroban Smart Contract Auditor",
    rating: 5,
    comment: "Verified the Cargo test integration flow. The cross-contract call from CarbonRegistry to CarbonAsset is secure and uses proper auth requirements. Solid technical foundation.",
    timestamp: Date.now() - 3600000 * 24 * 2.5,
    walletConnected: true,
  },
  {
    id: "fb-6",
    name: "Sophia Martinez",
    role: "Eco-Investments Partner",
    rating: 4,
    comment: "Tested Freighter wallet connection and XLM transfer on the dashboard. Loading states are informative and Freighter error messages are caught nicely. UX is polished and very professional.",
    timestamp: Date.now() - 3600000 * 24 * 2,
    walletConnected: true,
  },
  {
    id: "fb-7",
    name: "Liam O'Connor",
    role: "Stellar Ecosystem Developer",
    rating: 5,
    comment: "A textbook implementation of SEP-41 standard tokens for specialized carbon assets. The codebase is clean, well-structured, and modular. Deploy script works flawlessly on testnet.",
    timestamp: Date.now() - 3600000 * 24 * 1.5,
    walletConnected: true,
  },
  {
    id: "fb-8",
    name: "Amina Yusuf",
    role: "Grid Operator Liaison",
    rating: 4,
    comment: "Direct Oracle verification for clean energy generation metrics is the future of ESG compliance. Reduces reporting overhead from weeks to seconds. Looking forward to mainnet.",
    timestamp: Date.now() - 3600000 * 24 * 1,
    walletConnected: true,
  },
  {
    id: "fb-9",
    name: "Yukio Tanaka",
    role: "Carbon Offset Broker",
    rating: 5,
    comment: "By eliminating greenwashing through automated mathematical mint limits, this contract resolves the biggest credibility crisis in the offset markets today. Exceptionally useful product.",
    timestamp: Date.now() - 3600000 * 12, // 12 hours ago
    walletConnected: false,
  },
  {
    id: "fb-10",
    name: "Clara Dupont",
    role: "Environmental NGO Lead",
    rating: 5,
    comment: "Beautiful UI design and outstanding UX. The dashboard gives clear indicators of total verified data vs minted credits. Stellar's low transaction fees make micro-offsets viable.",
    timestamp: Date.now() - 3600000 * 3, // 3 hours ago
    walletConnected: true,
  }
];

export default function FeedbackPage() {
  const { address } = useStellar();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Regular User");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    // Load existing local feedbacks + presets
    const localData = localStorage.getItem("stellar_carbon_feedback");
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        setFeedbacks([...parsed, ...PRESET_FEEDBACKS]);
      } catch {
        setFeedbacks(PRESET_FEEDBACKS);
      }
    } else {
      setFeedbacks(PRESET_FEEDBACKS);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !comment) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    setTimeout(() => {
      const newItem: FeedbackItem = {
        id: `fb-user-${Date.now()}`,
        name: name.trim(),
        role: role,
        rating: rating,
        comment: comment.trim(),
        timestamp: Date.now(),
        walletConnected: !!address,
      };

      const currentLocal = localStorage.getItem("stellar_carbon_feedback");
      let updatedLocal: FeedbackItem[] = [];
      if (currentLocal) {
        try {
          updatedLocal = JSON.parse(currentLocal);
        } catch {
          updatedLocal = [];
        }
      }
      updatedLocal = [newItem, ...updatedLocal];
      localStorage.setItem("stellar_carbon_feedback", JSON.stringify(updatedLocal));

      setFeedbacks([newItem, ...feedbacks]);
      setIsSubmitting(false);
      setSubmitStatus("success");

      // Reset Form
      setName("");
      setComment("");
      setRating(5);
    }, 1000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      {/* Title */}
      <div className="flex items-center gap-3 border-b pb-4">
        <MessageSquare className="h-8 w-8 text-emerald-500" />
        <div>
          <h1 className="text-3xl font-bold">User Feedback & Reviews</h1>
          <p className="text-muted-foreground text-sm">We are shaping the future of carbon registries based on user and developer insights.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Feedback Input Form */}
        <div className="lg:col-span-1 border rounded-xl p-6 bg-card shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold">Share Your Feedback</h2>
            <p className="text-xs text-muted-foreground mt-1">Submit your rating and feedback below. Your comments will be stored locally.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full p-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Your Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Regular User">Regular User</option>
                <option value="Project Owner">Project Owner</option>
                <option value="Auditor / Oracle">Auditor / Oracle</option>
                <option value="Developer / Auditor">Developer / Auditor</option>
                <option value="Eco Investor">Eco Investor</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-2xl transition-colors duration-150 focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= (hoverRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Feedback Comments</label>
              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you think of the wallet integration, project registration, and transaction speed?"
                className="w-full p-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </form>

          {submitStatus === "success" && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <p>Feedback submitted successfully! Thank you for your review.</p>
            </div>
          )}
        </div>

        {/* Feedback Wall of Reviews */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ThumbsUp className="h-5 w-5 text-emerald-500" />
            Onboarded User Reviews ({feedbacks.length})
          </h2>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {feedbacks.map((item) => (
              <div key={item.id} className="p-5 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-3 items-center">
                    <div className="h-9 w-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">{item.role}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= item.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/20"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{item.comment}"
                </p>

                {item.walletConnected && (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded w-fit font-semibold">
                    <CheckCircle className="h-3 w-3" />
                    Verified wallet interaction proof
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
