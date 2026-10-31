import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorize.js";
import {
  listPublishedJobs,
  getPublishedJobById,
} from "../controllers/jobController.js";

const router = Router();

router.use(authenticate, authorizeRoles("STUDENT"));

router.get("/", listPublishedJobs);
router.get("/:jobId", getPublishedJobById);

export default router;
