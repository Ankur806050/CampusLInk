import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorize.js";

import {
  getStudentProfile,
  updateStudentProfile,
} from "../controllers/studentController.js";

import {
  uploadStudentResume,
  listStudentResumes,
  deleteStudentResume,
} from "../controllers/resumeController.js";

import { receiveResume } from "../middleware/resumeUpload.js";

import {
  applyToJob,
  getMyApplications,
} from "../controllers/applicationController.js";

const router = Router();

router.use(authenticate, authorizeRoles("STUDENT"));

// Student profile
router.get("/profile", getStudentProfile);
router.patch("/profile", updateStudentProfile);

// Resume management
router.post("/resumes", receiveResume, uploadStudentResume);
router.get("/resumes", listStudentResumes);
router.delete("/resumes/:resumeId", deleteStudentResume);

// Applications
router.post("/applications/:jobId", applyToJob);
router.get("/applications", getMyApplications);

export default router;
