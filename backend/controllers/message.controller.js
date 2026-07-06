import Message from "../models/Message.js";
import Gig from "../models/Gig.js";
import { io } from "../socket/socket.js";
import { notify } from "../utils/notify.js";

const ensureParticipant = (gig, userId) => {
  if (!gig) return false;
  const isOwner = gig.ownerId.toString() === userId.toString();
  const isFreelancer = gig.freelancerId && gig.freelancerId.toString() === userId.toString();
  return isOwner || isFreelancer;
};

export const getMessages = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) return res.status(404).json({ message: "Gig not found" });

    if (!ensureParticipant(gig, req.user._id)) {
      return res.status(403).json({ message: "Unauthorized to view this chat" });
    }

    const messages = await Message.find({ gigId: gig._id })
      .populate("senderId", "name role")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("GET_MESSAGES_ERROR:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { gigId, text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const gig = await Gig.findById(gigId);
    if (!gig) return res.status(404).json({ message: "Gig not found" });

    if (!ensureParticipant(gig, req.user._id)) {
      return res.status(403).json({ message: "Unauthorized to message in this chat" });
    }

    const message = await Message.create({
      gigId: gig._id,
      senderId: req.user._id,
      text: text.trim()
    });

    const populated = await message.populate("senderId", "name role");

    io.to(`gig_${gig._id.toString()}`).emit("new_message", populated);

    const recipientId = gig.ownerId.toString() === req.user._id.toString()
      ? gig.freelancerId
      : gig.ownerId;

    if (recipientId) {
      await notify({
        userId: recipientId,
        type: "new_message",
        message: `${req.user.name} sent you a message about "${gig.title}"`,
        gigId: gig._id
      });
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("SEND_MESSAGE_ERROR:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};