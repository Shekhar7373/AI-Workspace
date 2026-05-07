import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {
  createDocumentRecord,
  processDocument,
  deleteDocumentForUser,
  getDocumentForUser,
  listDocuments
} from "../services/documentService.js";
import { addDocumentProcessingJob } from "../jobs/documentQueue.js";

export const uploadDocumentController = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Document file is required.");
  const document = await createDocumentRecord({
    userId: req.user._id,
    file: req.file,
    title: req.body.title,
    subject: req.body.subject,
    tags: req.body.tags
  });

  try {
    await addDocumentProcessingJob(document._id);
  } catch {
    await processDocument(document);
  }

  res.status(201).json({ success: true, document });
});

export const getDocumentsController = asyncHandler(async (req, res) => {
  const documents = await listDocuments(req.user._id);
  res.json({ success: true, documents });
});

export const getDocumentController = asyncHandler(async (req, res) => {
  const document = await getDocumentForUser(req.user._id, req.params.id);
  res.json({ success: true, document });
});

export const deleteDocumentController = asyncHandler(async (req, res) => {
  await deleteDocumentForUser(req.user._id, req.params.id);
  res.json({ success: true, message: "Document deleted." });
});
