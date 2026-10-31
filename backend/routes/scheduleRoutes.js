import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorize.js";
import {
  createSchedule,
  getRecruiterSchedules,
  listPendingSchedules,
  decideSchedule,
  getStudentSchedules,
} from "../controllers/scheduleController.js";

const recruiterRouter = Router();
recruiterRouter.use(authenticate, authorizeRoles("RECRUITER"));
recruiterRouter.post("/", createSchedule);
recruiterRouter.get("/", getRecruiterSchedules);

const tpoRouter = Router();
tpoRouter.use(authenticate, authorizeRoles("TPO"));
tpoRouter.get("/pending", listPendingSchedules);
tpoRouter.patch("/:scheduleId/decision", decideSchedule);

const studentRouter = Router();
studentRouter.use(authenticate, authorizeRoles("STUDENT"));
studentRouter.get("/", getStudentSchedules);

export { recruiterRouter, tpoRouter, studentRouter };
