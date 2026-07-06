import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext";

export default function ChatBox({ gig }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      try {
        const res = await api.get(`/messages/${gig._id}`);
        if (isMounted) setMessages(res.data || []);
      } catch (err) {
        console.error("FETCH_MESSAGES_ERROR:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMessages();

    if (!socket.connected) socket.connect();
    socket.emit("join_gig", gig._id);

    const handleNewMessage = (message) => {
      if (message.gigId === gig._id || message.gigId?._id === gig._id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      isMounted = false;
      socket.emit("leave_gig", gig._id);
      socket.off("new_message", handleNewMessage);
    };
  }, [gig._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const draft = text.trim();
    setText("");
    try {
      await api.post("/messages", { gigId: gig._id, text: draft });
    } catch (err) {
      console.error("SEND_MESSAGE_ERROR:", err);
      setText(draft);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[420px] border border-white/10 bg-[#050607]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-[10px] font-mono text-gray-600 italic">LOADING_MESSAGES...</p>
        ) : messages.length === 0 ? (
          <p className="text-[10px] font-mono text-gray-600 italic">
            NO_MESSAGES_YET — Start the conversation.
          </p>
        ) : (
          messages.map((m) => {
            const isMine = (m.senderId?._id || m.senderId) === user?._id;
            return (
              <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-3 py-2 text-xs leading-relaxed ${
                    isMine
                      ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-100"
                      : "bg-white/[0.04] border border-white/10 text-gray-300"
                  }`}
                >
                  {!isMine && (
                    <p className="text-[8px] uppercase tracking-widest text-gray-500 mb-1">
                      {m.senderId?.name || "User"}
                    </p>
                  )}
                  <p>{m.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/10 p-3 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="TYPE_MESSAGE..."
          className="flex-grow bg-white/[0.03] border border-white/10 px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500/50"
        />
        <button
          onClick={handleSend}
          className="bg-emerald-600 hover:bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}