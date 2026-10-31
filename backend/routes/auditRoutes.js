import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorize.js";
import { listAuditLogs } from "../controllers/auditController.js";

const router = Router();

router.use(authenticate, authorizeRoles("TPO"));
router.get("/", listAuditLogs);

export default router;
