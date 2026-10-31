import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorize.js";

import {
  createRecruiterJob,
  getRecruiterJobs,
} from "../controllers/jobController.js";

import {
  getRecruiterApplicants,
  updateApplicationDecision,
} from "../controllers/applicationController.js";

const router = Router();

router.use(authenticate, authorizeRoles("RECRUITER"));

// Job management
router.post("/jobs", createRecruiterJob);
router.get("/jobs", getRecruiterJobs);

// Applicant management
router.get("/jobs/:jobId/applicants", getRecruiterApplicants);
router.patch("/applications/:applicationId/decision", updateApplicationDecision);

export default router;
