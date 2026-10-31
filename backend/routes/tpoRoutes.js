import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorize.js";

import {
  listJobsPendingApproval,
  decideJob,
} from "../controllers/jobController.js";

import {
  listCompanyRequestsForTpo,
  decideCompanyRequest,
} from "../controllers/companyController.js";

const router = Router();

router.use(authenticate, authorizeRoles("TPO"));

// Job approval
router.get("/jobs/pending", listJobsPendingApproval);
router.patch("/jobs/:jobId/decision", decideJob);

// Company registration requests and approval decisions
router.get("/companies/requests", listCompanyRequestsForTpo);
router.patch("/companies/:companyId/decision", decideCompanyRequest);

export default router;
