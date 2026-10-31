import { validateSignupDomain } from "../utils/authValidators.js";

export const validateSignup = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const domainResult = validateSignupDomain(result.data);

    if (!domainResult.valid) {
      return res.status(400).json({
        success: false,
        message: domainResult.message,
      });
    }

    // Downstream signup controllers should use req.validatedBody rather than
    // the original, unvalidated req.body.
    req.validatedBody = result.data;

    return next();
  };
};
