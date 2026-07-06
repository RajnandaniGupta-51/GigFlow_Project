import { useState } from "react";
import api from "../api/axios";

export default function CreateGigForm({ refreshGigs }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const budgetNum = Number(budget);
    if (!budgetNum || budgetNum < 1) {
      setError("Please enter a valid budget (minimum ₹1)");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/gigs", { title, description, budget: budgetNum });
      setTitle("");
      setDescription("");
      setBudget("");
      refreshGigs();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create gig");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyles = "w-full bg-transparent border-b border-white/10 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-700 text-white font-light uppercase tracking-widest";

  return (
    <form onSubmit={handleSubmit} className="space-y-12 max-w-4xl">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-[0.3em] text-emerald-500 font-bold">01. Project_Title</label>
            <input
              placeholder="ENTER GIG NOMENCLATURE..."
              className={inputStyles}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-[0.3em] text-emerald-500 font-bold">02. Financial_Allocation</label>
        
            <input
              type="number"
              min="1"
              placeholder="VALUE IN INR (₹)..."
              className={inputStyles}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] uppercase tracking-[0.3em] text-emerald-500 font-bold">03. Protocol_Description</label>
          <textarea
            placeholder="DEFINE SCOPE OF WORK AND DELIVERABLES..."
            className={`${inputStyles} h-full min-h-[120px] resize-none`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
          />
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-[10px] uppercase tracking-widest font-mono border border-red-500/20 px-4 py-2 bg-red-500/5">
          {error}
        </p>
      )}

      <button
        disabled={submitting}
        className="relative group overflow-hidden bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-10 py-4 text-[10px] font-black uppercase tracking-[0.4em] transition-all"
      >
        <span className="relative z-10">{submitting ? "Deploying..." : "Deploy_Gig"}</span>
        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
      </button>
    </form>
  );
}
