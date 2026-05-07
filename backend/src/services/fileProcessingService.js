import fs from "fs/promises";
import path from "path";
import mammoth from "mammoth";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function extractTextFromFile(filePath, mimeType) {
  if (mimeType === "text/plain") {
    return fs.readFile(filePath, "utf8");
  }

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  if (mimeType === "application/pdf") {
    const dataBuffer = await fs.readFile(filePath);
    const result = await pdfParse(dataBuffer);
    return result.text;
  }

  throw new Error(`Unsupported file type: ${mimeType || path.extname(filePath)}`);
}
