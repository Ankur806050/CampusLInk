
import mongoose from "mongoose";
import AuditLog from "../models/AuditLog.js";

const allowedEntityTypes = [
  "USER",
  "COMPANY",
  "JOB",
  "APPLICATION",
  "SCHEDULE",
  "PLACEMENT_OFFER",
];

export async function listAuditLogs(req, res, next) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 25)
    );

    const filter = {};

    if (req.query.entityType) {
      if (!allowedEntityTypes.includes(req.query.entityType)) {
        return res.status(400).json({ message: "Invalid entity type." });
      }

      filter.entityType = req.query.entityType;
    }

    if (req.query.entityId) {
      if (!mongoose.isValidObjectId(req.query.entityId)) {
        return res.status(400).json({ message: "Invalid entity ID." });
      }

      filter.entityId = req.query.entityId;
    }

    if (req.query.action) {
      filter.action = String(req.query.action).slice(0, 100);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("actor", "name email role")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return res.json({
      logs: logs.map((log) => ({
        id: log._id.toString(),
        actor: log.actor
          ? {
              id: log.actor._id.toString(),
              name: log.actor.name,
              email: log.actor.email,
              role: log.actor.role,
            }
          : null,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId.toString(),
        details: log.details,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}
