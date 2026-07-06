import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import ChatBox from "./ChatBox";

const STAGE_LABELS = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted For Review",
  changes_requested: "Changes Requested",
  completed: "Completed"
};

const STAGE_ORDER = ["not_started", "in_progress", "submitted", "completed"];

export default function ProjectDetailsModal({ gig, role, onClose, onGigUpdate }) {
  const [activeTab, setActiveTab] = useState("lifecycle");
  const [currentGig, setCurrentGig] = useState(gig);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isFreelancer = role === "freelancer";
  const isClient = role === "client";

  const applyUpdate = (updatedGig) => {
    setCurrentGig(updatedGig);
    onGigUpdate?.(updatedGig);
  };

  const runAction = async (fn) => {
    setError("");
    setBusy(true);
    try {
      const res = await fn();
      applyUpdate(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const handleStart = () =>
    runAction(() => api.patch(`/gigs/${currentGig._id}/start`));

  const handleAddMilestone = () => {
    if (!milestoneTitle.trim()) return;
    runAction(() => api.post(`/gigs/${currentGig._id}/milestones`, { title: milestoneTitle })).then(() => {
      setMilestoneTitle("");
    });
  };

  const handleToggleMilestone = (milestoneId) =>
    runAction(() => api.patch(`/gigs/${currentGig._id}/milestones/${milestoneId}`));

  const handleSubmitWork = () =>
    runAction(() => api.post(`/gigs/${currentGig._id}/submit`, { note: submissionNote }));

  const handleApprove = () =>
    runAction(() => api.patch(`/gigs/${currentGig._id}/approve`));

  const handleRequestChanges = () =>
    runAction(() => api.patch(`/gigs/${currentGig._id}/request-changes`));

  const stageIndex = STAGE_ORDER.indexOf(
    currentGig.stage === "changes_requested" ? "in_progress" : currentGig.stage
  );

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-[#0a0b0c] border border-white/10 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        >
          <div className="flex justify-between items-start p-6 border-b border-white/10">
            <div>
              <h3 className="text-lg uppercase font-bold tracking-tight text-white">{currentGig.title}</h3>
              <p className="text-[10px] font-mono text-gray-500 uppercase mt-1">
                Stage: <span className="text-emerald-500">{STAGE_LABELS[currentGig.stage] || "Not Started"}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white text-xs uppercase tracking-widest"
            >
              [ Close ]
            </button>
          </div>

          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab("lifecycle")}
              className={`flex-1 py-3 text-[10px] uppercase tracking-[0.3em] font-bold transition-colors ${
                activeTab === "lifecycle"
                  ? "text-emerald-500 border-b-2 border-emerald-500"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Project Lifecycle
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-3 text-[10px] uppercase tracking-[0.3em] font-bold transition-colors ${
                activeTab === "chat"
                  ? "text-emerald-500 border-b-2 border-emerald-500"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Real-Time Chat
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-grow">
            {error && (
              <p className="text-red-400 text-[10px] font-mono uppercase mb-4">{error}</p>
            )}

            {activeTab === "lifecycle" ? (
              <div className="space-y-8">
                {/* Stage progress */}
                <div className="flex items-center gap-1">
                  {STAGE_ORDER.map((stage, idx) => (
                    <div key={stage} className="flex-1 flex items-center">
                      <div
                        className={`h-1.5 flex-1 ${
                          idx <= stageIndex ? "bg-emerald-500" : "bg-white/10"
                        }`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[9px] font-mono text-gray-500 uppercase">
                  {currentGig.stage === "changes_requested"
                    ? "Changes requested by client — back to In Progress"
                    : `Current stage: ${STAGE_LABELS[currentGig.stage] || "Not Started"}`}
                </p>

                {/* Freelancer actions */}
                {isFreelancer && currentGig.stage === "not_started" && (
                  <button
                    disabled={busy}
                    onClick={handleStart}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black text-[10px] font-bold uppercase tracking-widest px-5 py-3 transition-colors"
                  >
                    [ Start Progress ]
                  </button>
                )}

                {/* Milestones */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold">
                    Milestones
                  </h4>
                  {currentGig.milestones?.length === 0 || !currentGig.milestones ? (
                    <p className="text-[10px] font-mono text-gray-600 italic">NO_MILESTONES_YET</p>
                  ) : (
                    <div className="space-y-2">
                      {currentGig.milestones.map((m) => (
                        <label
                          key={m._id}
                          className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-3 py-2 cursor-pointer hover:bg-white/[0.04] transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={m.done}
                            onChange={() => handleToggleMilestone(m._id)}
                            className="accent-emerald-500"
                          />
                          <span className={`text-xs ${m.done ? "line-through text-gray-500" : "text-gray-200"}`}>
                            {m.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentGig.stage !== "completed" && (
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="NEW_MILESTONE_TITLE..."
                        value={milestoneTitle}
                        onChange={(e) => setMilestoneTitle(e.target.value)}
                        className="flex-grow bg-white/[0.03] border border-white/10 px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500/50"
                      />
                      <button
                        disabled={busy}
                        onClick={handleAddMilestone}
                        className="border border-white/20 hover:border-white/40 text-white text-[10px] font-bold uppercase px-4 py-2 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>

                {/* Submission */}
                {isFreelancer && (currentGig.stage === "in_progress" || currentGig.stage === "changes_requested") && (
                  <div className="space-y-3 border-t border-white/5 pt-6">
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold">
                      Submit Work
                    </h4>
                    <textarea
                      placeholder="SUBMISSION_NOTE (links, summary, etc.)"
                      value={submissionNote}
                      onChange={(e) => setSubmissionNote(e.target.value)}
                      rows={3}
                      className="w-full bg-white/[0.03] border border-white/10 px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500/50 resize-none"
                    />
                    <button
                      disabled={busy}
                      onClick={handleSubmitWork}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black text-[10px] font-bold uppercase tracking-widest px-5 py-3 transition-colors"
                    >
                      [ Submit For Review ]
                    </button>
                  </div>
                )}

                {currentGig.stage === "submitted" && (
                  <div className="space-y-3 border-t border-white/5 pt-6">
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold">
                      Submission Review
                    </h4>
                    {currentGig.submissionNote && (
                      <p className="text-xs text-gray-300 bg-white/[0.02] border border-white/5 p-3 italic">
                        "{currentGig.submissionNote}"
                      </p>
                    )}
                    {isClient ? (
                      <div className="flex gap-3">
                        <button
                          disabled={busy}
                          onClick={handleApprove}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black text-[10px] font-bold uppercase tracking-widest px-5 py-3 transition-colors"
                        >
                          [ Approve & Complete ]
                        </button>
                        <button
                          disabled={busy}
                          onClick={handleRequestChanges}
                          className="border border-yellow-500/40 hover:border-yellow-400 text-yellow-400 text-[10px] font-bold uppercase tracking-widest px-5 py-3 transition-colors"
                        >
                          [ Request Changes ]
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] font-mono text-gray-600 italic">
                        WAITING_FOR_CLIENT_REVIEW...
                      </p>
                    )}
                  </div>
                )}

                {currentGig.stage === "completed" && (
                  <p className="text-emerald-500 text-xs font-mono uppercase border-t border-white/5 pt-6">
                    ✓ Project completed successfully.
                  </p>
                )}
              </div>
            ) : (
              <ChatBox gig={currentGig} />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}