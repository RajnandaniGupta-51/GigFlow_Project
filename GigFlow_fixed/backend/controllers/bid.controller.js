import Bid from "../models/Bid.js";
import Gig from "../models/Gig.js";
import { io } from "../socket/socket.js";
import { notify } from "../utils/notify.js";

export const createBid = async (req, res) => {
  try {
    const { gigId, price, message } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (req.user.role !== "freelancer") {
      return res.status(403).json({ error: "Only freelancers can place bids" });
    }

    const gig = await Gig.findById(gigId);
    if (!gig) return res.status(404).json({ error: "Gig not found" });
    if (gig.status !== "open") return res.status(400).json({ error: "This gig is no longer open for bids" });

    const existingBid = await Bid.findOne({ gigId, freelancerId: req.user._id });
    if (existingBid) {
      return res.status(400).json({ error: "You already bid on this gig" });
    }

    const bid = await Bid.create({
      gigId,
      freelancerId: req.user._id,
      price,
      message: message || ""
    });

    await notify({
      userId: gig.ownerId,
      type: "new_bid",
      message: `${req.user.name} placed a new bid on "${gig.title}"`,
      gigId: gig._id,
      bidId: bid._id
    });

    res.status(201).json(bid);
  } catch (err) {
    console.error("CREATE_BID_ERROR:", err);
    if (err.code === 11000) {
      return res.status(400).json({ error: "You already bid on this gig" });
    }
    res.status(500).json({ error: "Bid creation failed" });
  }
};

export const getBidsByGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) return res.status(404).json({ error: "Gig not found" });

    if (req.user.role !== "client" || gig.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized to view these bids" });
    }

    const bids = await Bid.find({ gigId: req.params.gigId })
      .populate("freelancerId", "name email")
      .populate({ path: "gigId", populate: { path: "ownerId", select: "name email" } });

    res.json(bids);
  } catch (err) {
    console.error("GET_BIDS_ERROR:", err);
    res.status(500).json({ error: "Failed to fetch bids" });
  }
};

export const hireBid = async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ error: "Only clients can hire freelancers" });
    }

    const bid = await Bid.findById(req.params.bidId).populate("freelancerId", "name email");
    if (!bid) return res.status(404).json({ error: "Bid not found" });

    const gig = await Gig.findById(bid.gigId);
    if (!gig || gig.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only hire for your own gigs" });
    }

    if (gig.status !== "open") {
      return res.status(400).json({ error: "This gig has already been assigned" });
    }

    bid.status = "accepted";
    await bid.save();

    await Bid.updateMany(
      { gigId: bid.gigId, _id: { $ne: bid._id } },
      { status: "rejected" }
    );

    const updatedGig = await Gig.findByIdAndUpdate(
      bid.gigId,
      { freelancerId: bid.freelancerId._id, status: "assigned" },
      { new: true }
    ).populate("ownerId", "name email");

    io.to(bid.freelancerId._id.toString()).emit("hired", { bid, gig: updatedGig });
    io.to(updatedGig.ownerId._id.toString()).emit("gig_assigned", { bid, gig: updatedGig });

    await notify({
      userId: bid.freelancerId._id,
      type: "hired",
      message: `You've been hired for "${updatedGig.title}"!`,
      gigId: updatedGig._id,
      bidId: bid._id
    });

    res.json({ success: true, bid, gig: updatedGig });
  } catch (err) {
    console.error("HIRE_BID_ERROR:", err);
    res.status(500).json({ error: "Hire failed" });
  }
};

export const counterBid = async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ error: "Only clients can send counter offers" });
    }

    const { bidId } = req.params;
    const { counterPrice } = req.body;

    if (!counterPrice || isNaN(counterPrice) || Number(counterPrice) < 1) {
      return res.status(400).json({ error: "A valid counter price is required" });
    }

    const bid = await Bid.findById(bidId).populate("freelancerId", "name email");
    if (!bid) return res.status(404).json({ error: "Bid not found" });

    const gig = await Gig.findById(bid.gigId);
    if (!gig || gig.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only counter bids on your own gigs" });
    }

    bid.status = "countered";
    bid.counterPrice = Number(counterPrice);
    await bid.save();

    io.to(bid.freelancerId._id.toString()).emit("bid_countered", {
      bid,
      message: "Client sent a counter offer"
    });

    await notify({
      userId: bid.freelancerId._id,
      type: "counter_offer",
      message: `You received a counter offer of ₹${counterPrice} on "${gig.title}"`,
      gigId: gig._id,
      bidId: bid._id
    });

    res.status(200).json(bid);
  } catch (err) {
    console.error("COUNTER_BID_ERROR:", err);
    res.status(500).json({ error: "Counter bid failed" });
  }
};

export const getMyBids = async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ error: "Only freelancers can view their bids" });
    }

    const bids = await Bid.find({ freelancerId: req.user._id })
      .populate({ path: "gigId", populate: { path: "ownerId", select: "name email" } })
      .sort({ updatedAt: -1 });

    res.json(bids);
  } catch (err) {
    console.error("GET_MY_BIDS_ERROR:", err);
    res.status(500).json({ error: "Failed to fetch bids" });
  }
};

export const acceptCounterBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.bidId)
      .populate("gigId")
      .populate("freelancerId", "name email");

    if (!bid) return res.status(404).json({ error: "Bid not found" });

    if (bid.freelancerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (bid.status !== "countered") {
      return res.status(400).json({ error: "No counter offer to accept" });
    }

    bid.status = "accepted";
    bid.price = bid.counterPrice;
    bid.counterPrice = null;
    await bid.save();

    await Bid.updateMany(
      { gigId: bid.gigId._id, _id: { $ne: bid._id } },
      { status: "rejected" }
    );

    const updatedGig = await Gig.findByIdAndUpdate(
      bid.gigId._id,
      { freelancerId: bid.freelancerId._id, status: "assigned" },
      { new: true }
    );

    io.to(updatedGig.ownerId.toString()).emit("gig_assigned", { bid, gig: updatedGig });

    await notify({
      userId: updatedGig.ownerId,
      type: "counter_accepted",
      message: `${bid.freelancerId.name} accepted your counter offer on "${bid.gigId.title}"`,
      gigId: updatedGig._id,
      bidId: bid._id
    });

    res.json({ bid, gig: updatedGig });
  } catch (err) {
    console.error("ACCEPT_COUNTER_ERROR:", err);
    res.status(500).json({ error: "Accept failed" });
  }
};