import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorize.js";
import {
  createCompanyRequest,
  getMyCompanyRequests,
} from "../controllers/companyController.js";

const router = Router();

router.use(authenticate, authorizeRoles("RECRUITER"));

router.post("/requests", createCompanyRequest);
router.get("/requests", getMyCompanyRequests);

export default router;
