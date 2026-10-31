
import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { fileTypeFromBuffer } from "file-type";
import AdmZip from "adm-zip";

import Resume from "../models/Resume.js";

const RESUME_DIRECTORY = path.resolve(
  process.cwd(),
  "uploads",
  "resumes"
);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function safeOriginalName(name) {
  // Keep only the base filename, without directory components.
  return path.basename(name).replace(/[\r\n\0]/g, "_").slice(0, 255);
}

async function identifyResume(buffer) {
  const detected = await fileTypeFromBuffer(buffer);

  if (detected?.mime === "application/pdf") {
    return {
      mimeType: "application/pdf",
      extension: ".pdf",
    };
  }

  // DOCX files are ZIP containers. Check for Word document entries,
  // rather than accepting every arbitrary ZIP file as a DOCX.
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b
  ) {
    try {
      const zip = new AdmZip(buffer);
      const entries = new Set(
        zip.getEntries().map((entry) => entry.entryName)
      );

      if (
        entries.has("[Content_Types].xml") &&
        entries.has("word/document.xml")
      ) {
        return {
          mimeType: DOCX_MIME,
          extension: ".docx",
        };
      }
    } catch {
      // Malformed ZIP or DOCX file.
    }
  }

  return null;
}

// POST /api/student/resumes
export async function uploadStudentResume(req, res) {
  let savedPath;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a PDF or DOCX resume to upload.",
      });
    }

    if (
      !req.file.buffer ||
      req.file.size < 1 ||
      req.file.size > MAX_FILE_SIZE
    ) {
      return res.status(400).json({
        success: false,
        message: "Resume must be between 1 byte and 5 MB.",
      });
    }

    const detected = await identifyResume(req.file.buffer);

    if (!detected) {
      return res.status(400).json({
        success: false,
        message: "The file contents are not a valid PDF or DOCX resume.",
      });
    }

    await mkdir(RESUME_DIRECTORY, { recursive: true });

    const storageName = `${randomUUID()}${detected.extension}`;
    savedPath = path.join(RESUME_DIRECTORY, storageName);

    await writeFile(savedPath, req.file.buffer, { flag: "wx" });

    const resume = await Resume.create({
      student: req.user.id,
      originalName: safeOriginalName(req.file.originalname),
      storageName,
      mimeType: detected.mimeType,
      size: req.file.size,
    });

    return res.status(201).json({
      success: true,
      message: "Resume uploaded successfully.",
      data: {
        id: resume._id.toString(),
        originalName: resume.originalName,
        mimeType: resume.mimeType,
        size: resume.size,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    // If the file was saved but the database operation failed,
    // try to remove the orphaned file.
    if (savedPath) {
      try {
        await unlink(savedPath);
      } catch {
        // Preserve the original error.
      }
    }

    console.error("Resume upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to upload resume.",
    });
  }
}

// GET /api/student/resumes
export async function listStudentResumes(req, res) {
  try {
    const resumes = await Resume.find({
      student: req.user.id,
    })
      .sort({ createdAt: -1 })
      .select("originalName mimeType size createdAt updatedAt");

    return res.status(200).json({
      success: true,
      data: resumes.map((resume) => ({
        id: resume._id.toString(),
        originalName: resume.originalName,
        mimeType: resume.mimeType,
        size: resume.size,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      })),
    });
  } catch (error) {
    console.error("List resumes error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve resumes.",
    });
  }
}

// DELETE /api/student/resumes/:resumeId
export async function deleteStudentResume(req, res) {
  try {
    const { resumeId } = req.params;

    if (!/^[a-f\d]{24}$/i.test(resumeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resume ID.",
      });
    }

    // Ownership check: students can delete only their own resumes.
    const resume = await Resume.findOne({
      _id: resumeId,
      student: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found.",
      });
    }

    await Resume.deleteOne({ _id: resume._id });

    const filePath = path.join(
      RESUME_DIRECTORY,
      resume.storageName
    );

    try {
      await unlink(filePath);
    } catch (error) {
      // The DB record is deleted. Log a failed disk cleanup for later
      // operational cleanup instead of reporting the deletion as failed.
      console.error("Resume file cleanup error:", error);
    }

    return res.status(200).json({
      success: true,
      message: "Resume deleted successfully.",
    });
  } catch (error) {
    console.error("Delete resume error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete resume.",
    });
  }
}
