import multer from "multer";

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    // MIME type is supplied by the client and is only a preliminary filter.
    // The controller must still inspect the file contents before saving it.
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error("UNSUPPORTED_RESUME_TYPE"));
    }

    return callback(null, true);
  },
});

export function receiveResume(req, res, next) {
  upload.single("resume")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "Resume must not exceed 5 MB."
          : error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE"
            ? "Upload exactly one file using the 'resume' field."
            : "Unable to receive the uploaded file.";

      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (error.message === "UNSUPPORTED_RESUME_TYPE") {
      return res.status(400).json({
        success: false,
        message: "Only PDF and DOCX resumes are accepted.",
      });
    }

    console.error("Resume upload error:", error.message || error);

    return res.status(400).json({
      success: false,
      message: "Invalid file upload.",
    });
  });
}
