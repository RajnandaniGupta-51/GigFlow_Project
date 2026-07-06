import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import ProjectDetailsModal from "../components/ProjectDetailsModal";

export default function ClientGigCard({ gig, onGigUpdate }) {
  const [bids, setBids] = useState([]);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [hasResponses, setHasResponses] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [counterInputs, setCounterInputs] = useState({});
  const [counterError, setCounterError] = useState("");

  useEffect(() => {
    const checkBids = async () => {
      try {
        const res = await api.get(`/bids/${gig._id}`);
        setBids(res.data);
        setHasResponses(res.data.length > 0);
      } catch {
        // silently fail
      }
    };
    checkBids();
  }, [gig._id]);

  const fetchBids = async () => {
    try {
      const res = await api.get(`/bids/${gig._id}`);
      setBids(res.data);
      setHasResponses(res.data.length > 0);
    } catch (err) {
      console.error("BID_FETCH_ERROR:", err);
    }
  };

  const openResponsesModal = async () => {
    await fetchBids();
    setShowBidsModal(true);
  };

  const handleHire = async (bidId) => {
    if (!window.confirm("CONFIRM_ACTION: Initialize hiring protocol for this node?")) return;
    try {
      const res = await api.patch(`/bids/${bidId}/hire`);
      const { gig: updatedGig, bid: updatedBid } = res.data;
      setBids((prev) => prev.map((b) => (b._id === updatedBid._id ? updatedBid : b)));
      onGigUpdate(updatedGig);
      setShowBidsModal(false);
    } catch (err) {
      alert(err.response?.data?.error || "CRITICAL_ERROR: Action failed");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("CONFIRM_ACTION: Delete this gig permanently?")) return;
    try {
      await api.delete(`/gigs/${gig._id}`);
      onGigUpdate({ _id: gig._id, deleted: true });
    } catch (err) {
      alert(err.response?.data?.message || "CRITICAL_ERROR: Gig deletion failed");
    }
  };

  const handleCounter = async (bidId) => {
    const newPrice = counterInputs[bidId];
    if (!newPrice || isNaN(newPrice) || Number(newPrice) < 1) {
      setCounterError("Please enter a valid counter price");
      return;
    }
    setCounterError("");
    try {
      const res = await api.patch(`/bids/${bidId}/counter`, { counterPrice: Number(newPrice) });
      setBids((prev) => prev.map((b) => (b._id === res.data._id ? res.data : b)));
      setCounterInputs((prev) => ({ ...prev, [bidId]: "" }));
    } catch (err) {
      alert(err.response?.data?.error || "CRITICAL_ERROR: Counter failed");
    }
  };

  return (
    <div className="relative group bg-[#0a0b0c] p-6 border border-white/5 hover:border-emerald-500/30 transition-all duration-500">

      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/10 group-hover:border-emerald-500/50 transition-colors" />

      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="relative">
            <h3 className="text-lg font-bold tracking-tight text-white uppercase">
              {gig.title}
            </h3>
            {hasResponses && gig.status !== "assigned" && (
              <span
                className="absolute -top-2 -left-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                title="New Responses!"
              />
            )}
          </div>

          <span className={`text-[10px] font-mono px-2 py-1 border ${
            gig.status === "assigned"
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "bg-white/5 text-gray-400 border-white/10"
          }`}>
            {gig.status.toUpperCase()}
          </span>
        </div>

        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 uppercase tracking-wider font-light">
          {gig.description}
        </p>

        <div className="pt-4 border-t border-white/5 flex justify-between items-center">
          <div>
            <p className="text-[8px] uppercase tracking-[0.2em] text-gray-600 mb-1">Target_Budget</p>
            <p className="text-xl font-mono text-white">₹{gig.budget}</p>
          </div>
          <button
            onClick={() => gig.status === "assigned" ? setShowDetails(true) : openResponsesModal()}
            className="text-[10px] uppercase tracking-widest font-bold text-emerald-500 hover:text-white transition-colors"
          >
            {gig.status === "assigned" ? "[ View_Details ]" : "[ View_Responses ]"}
          </button>
        </div>

        {gig.status !== "assigned" && (
          <button
            onClick={handleDelete}
            className="text-[10px] uppercase tracking-widest font-bold text-red-500 hover:text-red-400 transition-colors"
          >
            [ Delete_Gig ]
          </button>
        )}
      </div>

      {showDetails && (
        <ProjectDetailsModal
          gig={gig}
          role="client"
          onClose={() => setShowDetails(false)}
          onGigUpdate={onGigUpdate}
        />
      )}

      {/* RESPONSES POPUP MODAL */}
      <AnimatePresence>
        {showBidsModal && gig.status !== "assigned" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowBidsModal(false); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.97 }}
              className="bg-[#0a0b0c] border border-white/10 w-full max-w-2xl max-h-[80vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center px-8 py-5 border-b border-white/5">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.4em] text-emerald-500 font-bold mb-1">
                    Bid_Responses
                  </p>
                  <h3 className="text-sm font-bold uppercase tracking-tight text-white">
                    {gig.title}
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-mono text-gray-500">
                    {bids.length} RESPONSE{bids.length !== 1 ? "S" : ""}
                  </span>
                  <button
                    onClick={() => setShowBidsModal(false)}
                    className="text-[10px] uppercase tracking-widest text-gray-600 hover:text-red-400 transition-colors font-mono"
                  >
                    [ Close ]
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto flex-1 p-8 space-y-4">
                {bids.length === 0 ? (
                  <p className="text-[10px] font-mono text-gray-600 italic text-center py-12">
                    SYSTEM_STATUS: NO_RESPONSES_DETECTED
                  </p>
                ) : (
                  bids.map((bid) => (
                    <div key={bid._id} className="bg-white/[0.02] border border-white/5 p-5 hover:bg-white/[0.04] transition-colors">

                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs font-bold text-white uppercase">{bid.freelancerId.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{bid.freelancerId.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-mono text-white">₹{bid.price}</p>
                          {bid.counterPrice && (
                            <span className="text-[8px] font-mono text-blue-400">COUNTER: ₹{bid.counterPrice}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-[9px] font-mono px-2 py-0.5 border ${
                          bid.status === "accepted" ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/10" :
                          bid.status === "rejected" ? "text-red-400 border-red-400/20 bg-red-400/10" :
                          bid.status === "countered" ? "text-blue-400 border-blue-400/20 bg-blue-400/10" :
                          "text-gray-400 border-white/10"
                        }`}>
                          {bid.status.toUpperCase()}
                        </span>
                      </div>

                      {bid.message && (
                        <p className="text-[11px] text-gray-400 mb-4 font-light italic border-l border-white/10 pl-3">
                          "{bid.message}"
                        </p>
                      )}

                      {(bid.status === "pending" || bid.status === "countered") && (
                        <div className="space-y-2 pt-3 border-t border-white/5">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleHire(bid._id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-black text-[9px] px-4 py-2 font-bold uppercase transition-colors"
                            >
                              Accept & Hire
                            </button>
                            <input
                              type="number"
                              placeholder="Counter price (₹)"
                              value={counterInputs[bid._id] || ""}
                              onChange={(e) => setCounterInputs(prev => ({ ...prev, [bid._id]: e.target.value }))}
                              className="bg-white/5 border border-white/10 text-white placeholder-gray-600 text-[10px] px-3 py-2 w-40 focus:outline-none focus:border-emerald-500/50 font-mono"
                              min="1"
                            />
                            <button
                              onClick={() => handleCounter(bid._id)}
                              className="border border-white/20 hover:border-white/40 text-white text-[9px] px-4 py-2 font-bold uppercase transition-colors"
                            >
                              Bargain
                            </button>
                          </div>
                          {counterError && (
                            <p className="text-red-400 text-[9px] font-mono">{counterError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}