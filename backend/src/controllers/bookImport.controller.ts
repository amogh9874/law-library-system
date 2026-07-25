import { Request, Response } from "express";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { importBooksSchema } from "../validators/bookImport.validator";
import { parseExcelBuffer, importBooksFromRows, generateImportTemplate } from "../services/bookImport.service";
import { logActivity } from "../services/activityLog.service";

const MAX_IMPORT_ROWS = 10000;

export const importBooks = asyncHandler(async (req: Request, res: Response) => {
  const { fileBase64 } = importBooksSchema.parse(req.body);

  let buffer: Buffer;
  try {
    // Accept both a raw base64 string and a data URL prefix
    // (e.g. "data:application/vnd.openxmlformats...;base64,AAAA...").
    const commaIndex = fileBase64.indexOf(",");
    const cleanBase64 = fileBase64.startsWith("data:") && commaIndex !== -1
      ? fileBase64.slice(commaIndex + 1)
      : fileBase64;
    buffer = Buffer.from(cleanBase64, "base64");
  } catch {
    throw new AppError("The uploaded file could not be read. Please upload a valid .xlsx file", 400);
  }

  if (buffer.length === 0) {
    throw new AppError("The uploaded file is empty", 400);
  }

  let parsed;
  try {
    parsed = await parseExcelBuffer(buffer);
  } catch {
    throw new AppError(
      "Could not read this file as an Excel spreadsheet. Please upload a .xlsx file with a header row.",
      400
    );
  }

  if (parsed.rows.length === 0) {
    throw new AppError("No data rows were found in the file (only a header row, or the file is empty)", 400);
  }

  if (parsed.rows.length > MAX_IMPORT_ROWS) {
    throw new AppError(
      `This file has ${parsed.rows.length} rows, which exceeds the ${MAX_IMPORT_ROWS} row limit per import. Please split it into smaller files.`,
      400
    );
  }

  const result = await importBooksFromRows(parsed.rows, req.user!.userId);
  result.unrecognizedHeaders = parsed.unrecognizedHeaders;

  await logActivity({
    userId: req.user!.userId,
    action: "BOOKS_IMPORTED",
    module: "Books",
    details: `${result.successCount} of ${result.totalRows} rows imported successfully`,
    req,
  });

  res.json(result);
});

export const downloadImportTemplate = asyncHandler(async (_req: Request, res: Response) => {
  const buffer = await generateImportTemplate();
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="book-import-template.xlsx"');
  res.send(buffer);
});
