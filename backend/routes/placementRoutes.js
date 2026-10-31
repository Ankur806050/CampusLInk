import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorize.js";
import {
  submitFinalResult,
  getMyPlacementResults,
  listPlacementResults,
  respondToOffer,
} from "../controllers/placementController.js";

const recruiterRouter = Router();
recruiterRouter.use(authenticate, authorizeRoles("RECRUITER"));
recruiterRouter.post("/results", submitFinalResult);

const studentRouter = Router();
studentRouter.use(authenticate, authorizeRoles("STUDENT"));
studentRouter.get("/results", getMyPlacementResults);
studentRouter.patch("/offers/:offerId/response", respondToOffer);

const tpoRouter = Router();
tpoRouter.use(authenticate, authorizeRoles("TPO"));
tpoRouter.get("/results", listPlacementResults);

export {
  recruiterRouter as recruiterPlacementRoutes,
  studentRouter as studentPlacementRoutes,
  tpoRouter as tpoPlacementRoutes,
};
