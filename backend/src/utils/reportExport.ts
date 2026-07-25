import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { ReportType } from "../services/report.service";

interface FlatReport {
  headers: string[];
  rows: string[][];
}

// Converts the varied shapes returned by reportService.generate() into a
// flat table (headers + rows) that all three export formats can share.
export function flattenReportData(type: ReportType, data: any[]): FlatReport {
  switch (type) {
    case "available-books":
    case "lost-books":
    case "damaged-books":
      return {
        headers: ["Accession No.", "Title", "Author", "Category", "Book Type", "Condition"],
        rows: data.map((b) => [
          b.accessionNumber,
          b.title,
          b.author?.name ?? "",
          b.category?.name ?? "",
          b.bookType,
          b.condition,
        ]),
      };

    case "issued-books":
      return {
        headers: ["Accession No.", "Title", "Author", "Issued To", "Due Date"],
        rows: data.map((b) => [
          b.accessionNumber,
          b.title,
          b.author?.name ?? "",
          b.borrowRecords?.[0]?.employee?.name ?? "",
          b.borrowRecords?.[0]?.dueDate ? new Date(b.borrowRecords[0].dueDate).toLocaleDateString() : "",
        ]),
      };

    case "borrow-history":
      return {
        headers: ["Book", "Employee", "Issue Date", "Due Date", "Return Date", "Status"],
        rows: data.map((r) => [
          r.book?.title ?? "",
          r.employee?.name ?? "",
          new Date(r.issueDate).toLocaleDateString(),
          new Date(r.dueDate).toLocaleDateString(),
          r.returnDate ? new Date(r.returnDate).toLocaleDateString() : "-",
          r.status,
        ]),
      };

    case "books-added":
      return {
        headers: ["Accession No.", "Title", "Author", "Category", "Date Added"],
        rows: data.map((b) => [
          b.accessionNumber,
          b.title,
          b.author?.name ?? "",
          b.category?.name ?? "",
          new Date(b.createdAt).toLocaleDateString(),
        ]),
      };

    case "books-removed":
      return {
        headers: ["Accession No.", "Title", "Author", "Date Removed"],
        rows: data.map((b) => [
          b.accessionNumber,
          b.title,
          b.author?.name ?? "",
          b.deletedAt ? new Date(b.deletedAt).toLocaleDateString() : "",
        ]),
      };

    default:
      return { headers: [], rows: [] };
  }
}

export function toCsv(report: FlatReport): string {
  const escapeCsvCell = (cell: string) => {
    if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  };

  const lines = [
    report.headers.map(escapeCsvCell).join(","),
    ...report.rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  return lines.join("\n");
}

export async function toExcelBuffer(report: FlatReport, sheetName: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.addRow(report.headers);
  sheet.getRow(1).font = { bold: true };
  report.rows.forEach((row) => sheet.addRow(row));

  sheet.columns.forEach((column) => {
    column.width = 22;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function toPdfBuffer(report: FlatReport, title: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).text(title, { align: "center" });
    doc.moveDown();

    const colWidth = (doc.page.width - 80) / Math.max(report.headers.length, 1);
    const startX = doc.x;
    let y = doc.y;

    doc.fontSize(9).font("Helvetica-Bold");
    report.headers.forEach((header, i) => {
      doc.text(header, startX + i * colWidth, y, { width: colWidth, ellipsis: true });
    });
    y += 18;
    doc.moveTo(startX, y - 4).lineTo(doc.page.width - 40, y - 4).stroke();

    doc.font("Helvetica");
    report.rows.forEach((row) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = doc.y;
      }
      row.forEach((cell, i) => {
        doc.text(cell, startX + i * colWidth, y, { width: colWidth, ellipsis: true });
      });
      y += 16;
    });

    doc.end();
  });
}
