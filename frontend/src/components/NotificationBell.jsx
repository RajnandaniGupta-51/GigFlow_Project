import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext";

const TYPE_LABELS = {
  new_bid: "New Bid",
  counter_offer: "Counter Offer",
  hired: "Hired",
  counter_accepted: "Counter Accepted",
  gig_assigned: "Gig Assigned",
  stage_update: "Project Update",
  work_submitted: "Work Submitted",
  work_approved: "Work Approved",
  changes_requested: "Changes Requested",
  new_message: "New Message"
};

function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/me");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("FETCH_NOTIFICATIONS_ERROR:", err);
    }
  };

  useEffect(() => {
    if (!user?._id) return;
    fetchNotifications();
    if (!socket.connected) socket.connect();
    socket.emit("join", user._id);

    const handleNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification", handleNotification);
    return () => socket.off("notification", handleNotification);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      try {
        await api.patch("/notifications/read-all");
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      } catch (err) {
        console.error("MARK_ALL_READ_ERROR:", err);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative border border-white/10 hover:border-emerald-500/50 text-gray-300 hover:text-emerald-400 transition-all p-2.5"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-emerald-500 text-black text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 max-h-[420px] overflow-y-auto bg-[#0a0b0c]  z-[200] shadow-2xl"
          >
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.3em] text-emerald-500 font-bold">
                Notifications
              </span>
              <span className="text-[9px] font-mono text-gray-600">{notifications.length}</span>
            </div>

            {notifications.length === 0 ? (
              <p className="text-[10px] font-mono text-gray-600 italic px-4 py-6 text-center">
                NO_NOTIFICATIONS_YET
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`px-4 py-3 border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
                    !n.isRead ? "bg-emerald-500/5" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-500">
                      {TYPE_LABELS[n.type] || n.type}
                    </span>
                    <span className="text-[8px] font-mono text-gray-600 whitespace-nowrap">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}