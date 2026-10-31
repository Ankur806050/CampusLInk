
import AuditLog from "../models/AuditLog.js";

export async function writeAuditLog({
  actor,
  action,
  entityType,
  entityId,
  details = {},
  ipAddress,
}) {
  try {
    return await AuditLog.create({
      actor: actor || null,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
    });
  } catch (error) {
    // Keep audit failures visible. For critical production workflows,
    // write the business change and audit record in one transaction.
    console.error("Failed to write audit log:", error.message);
    return null;
  }
}
