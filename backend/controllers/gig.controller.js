import Gig from "../models/Gig.js";
import { notify } from "../utils/notify.js";

export const createGig = async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Only clients can create gigs" });
    }

    const budget = Number(req.body.budget);
    if (!budget || budget < 1) {
      return res.status(400).json({ message: "A valid budget is required" });
    }

    const gig = await Gig.create({
      title: req.body.title,
      description: req.body.description,
      budget,
      ownerId: req.user._id
    });

    res.status(201).json(gig);
  } catch (err) {
    console.error("CREATE_GIG_ERROR:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(", ") });
    }
    res.status(500).json({ message: "Gig creation failed" });
  }
};

export const getGigs = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    let filter = {};
    if (req.user.role === "client") {
      filter = { ownerId: req.user._id };
    } else {
      filter = { status: "open" };
    }

    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: "i" };
    }

    const gigs = await Gig.find(filter).populate("ownerId", "name email");

    res.json(gigs);
  } catch (error) {
    console.error("GET_GIGS_ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getFreelancerGigs = async (req, res) => {
  try {
    const gigs = await Gig.find({ freelancerId: req.user._id });
    res.json(gigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ message: "Gig not found" });
    }

    if (req.user.role !== "client" || gig.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    if (gig.status === "assigned") {
      return res.status(400).json({ message: "Cannot delete a gig that has already been assigned" });
    }

    await gig.deleteOne();
    res.json({ message: "Gig deleted successfully", gigId: gig._id });
  } catch (err) {
    console.error("DELETE_GIG_ERROR:", err);
    res.status(500).json({ message: "Gig deletion failed" });
  }
};


const getAssignedGigOr403 = async (req) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) return { error: { code: 404, message: "Gig not found" } };

  const isOwner = gig.ownerId.toString() === req.user._id.toString();
  const isFreelancer = gig.freelancerId && gig.freelancerId.toString() === req.user._id.toString();

  if (!isOwner && !isFreelancer) {
    return { error: { code: 403, message: "Unauthorized to manage this gig" } };
  }
  if (gig.status !== "assigned" && gig.status !== "completed") {
    return { error: { code: 400, message: "This gig has not been assigned yet" } };
  }
  return { gig, isOwner, isFreelancer };
};

export const startGigProgress = async (req, res) => {
  try {
    const { gig, isFreelancer, error } = await getAssignedGigOr403(req);
    if (error) return res.status(error.code).json({ message: error.message });

    if (!isFreelancer) {
      return res.status(403).json({ message: "Only the assigned freelancer can start progress" });
    }

    gig.stage = "in_progress";
    await gig.save();

    await notify({
      userId: gig.ownerId,
      type: "stage_update",
      message: `Work has started on "${gig.title}"`,
      gigId: gig._id
    });

    res.json(gig);
  } catch (err) {
    console.error("START_PROGRESS_ERROR:", err);
    res.status(500).json({ message: "Failed to update stage" });
  }
};

export const addMilestone = async (req, res) => {
  try {
    const { gig, error } = await getAssignedGigOr403(req);
    if (error) return res.status(error.code).json({ message: error.message });

    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Milestone title is required" });
    }

    gig.milestones.push({ title: title.trim(), done: false });
    await gig.save();

    res.status(201).json(gig);
  } catch (err) {
    console.error("ADD_MILESTONE_ERROR:", err);
    res.status(500).json({ message: "Failed to add milestone" });
  }
};

export const toggleMilestone = async (req, res) => {
  try {
    const { gig, error } = await getAssignedGigOr403(req);
    if (error) return res.status(error.code).json({ message: error.message });

    const milestone = gig.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });

    milestone.done = !milestone.done;
    await gig.save();

    res.json(gig);
  } catch (err) {
    console.error("TOGGLE_MILESTONE_ERROR:", err);
    res.status(500).json({ message: "Failed to update milestone" });
  }
};


export const submitWork = async (req, res) => {
  try {
    const { gig, isFreelancer, error } = await getAssignedGigOr403(req);
    if (error) return res.status(error.code).json({ message: error.message });

    if (!isFreelancer) {
      return res.status(403).json({ message: "Only the assigned freelancer can submit work" });
    }

    gig.stage = "submitted";
    gig.submissionNote = (req.body.note || "").trim();
    gig.lastSubmittedAt = new Date();
    await gig.save();

    await notify({
      userId: gig.ownerId,
      type: "work_submitted",
      message: `Work has been submitted for review on "${gig.title}"`,
      gigId: gig._id
    });

    res.json(gig);
  } catch (err) {
    console.error("SUBMIT_WORK_ERROR:", err);
    res.status(500).json({ message: "Failed to submit work" });
  }
};

export const approveWork = async (req, res) => {
  try {
    const { gig, isOwner, error } = await getAssignedGigOr403(req);
    if (error) return res.status(error.code).json({ message: error.message });

    if (!isOwner) {
      return res.status(403).json({ message: "Only the client can approve work" });
    }
    if (gig.stage !== "submitted") {
      return res.status(400).json({ message: "No submission is pending approval" });
    }

    gig.stage = "completed";
    gig.status = "completed";
    await gig.save();

    await notify({
      userId: gig.freelancerId,
      type: "work_approved",
      message: `Your work on "${gig.title}" was approved! Project completed.`,
      gigId: gig._id
    });

    res.json(gig);
  } catch (err) {
    console.error("APPROVE_WORK_ERROR:", err);
    res.status(500).json({ message: "Failed to approve work" });
  }
};


export const requestChanges = async (req, res) => {
  try {
    const { gig, isOwner, error } = await getAssignedGigOr403(req);
    if (error) return res.status(error.code).json({ message: error.message });

    if (!isOwner) {
      return res.status(403).json({ message: "Only the client can request changes" });
    }
    if (gig.stage !== "submitted") {
      return res.status(400).json({ message: "No submission is pending review" });
    }

    gig.stage = "changes_requested";
    await gig.save();

    await notify({
      userId: gig.freelancerId,
      type: "changes_requested",
      message: `Changes were requested on "${gig.title}"`,
      gigId: gig._id
    });

    res.json(gig);
  } catch (err) {
    console.error("REQUEST_CHANGES_ERROR:", err);
    res.status(500).json({ message: "Failed to request changes" });
  }
};