
import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
  createGig,
  getGigs,
  getFreelancerGigs,
  deleteGig,
  startGigProgress,
  addMilestone,
  toggleMilestone,
  submitWork,
  approveWork,
  requestChanges
} from "../controllers/gig.controller.js";


const router = express.Router();

router.get("/",auth, getGigs); 
router.get("/freelancer", auth, getFreelancerGigs); 
router.post("/", auth, createGig);
router.delete("/:id", auth, deleteGig);

router.patch("/:id/start", auth, startGigProgress);
router.post("/:id/milestones", auth, addMilestone);
router.patch("/:id/milestones/:milestoneId", auth, toggleMilestone);
router.post("/:id/submit", auth, submitWork);
router.patch("/:id/approve", auth, approveWork);
router.patch("/:id/request-changes", auth, requestChanges);

export default router;