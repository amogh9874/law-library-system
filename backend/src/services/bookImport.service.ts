import ExcelJS from "exceljs";
import { prisma } from "../config/prisma";
import { normalizeBookType, normalizeCondition } from "../utils/bookTypeLabels";

// Maps our internal field keys to every header spelling we'll accept in the
// spreadsheet. Matching is case-insensitive and ignores spaces/underscores,
// so "Accession Number", "accession_number", and "ACCESSIONNUMBER" all work.
const HEADER_ALIASES: Record<string, string[]> = {
  accessionNumber: ["accessionnumber", "accessionno", "accno"],
  isbn: ["isbn"],
  barcodeNumber: ["barcodenumber", "barcode"],
  title: ["title"],
  subtitle: ["subtitle"],
  authorName: ["author", "authorname"],
  publisherName: ["publisher", "publishername"],
  publicationYear: ["publicationyear", "year"],
  edition: ["edition"],
  volume: ["volume"],
  categoryName: ["category", "categoryname"],
  subject: ["subject"],
  language: ["language"],
  description: ["description"],
  keywords: ["keywords"],
  bookType: ["booktype", "type"],
  numberOfPages: ["numberofpages", "pages"],
  condition: ["condition"],
  floorName: ["floor"],
  roomName: ["room"],
  shelfName: ["shelf"],
  row: ["row"],
  position: ["position"],
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s_.-]/g, "");
}

export interface ParsedRow {
  rowNumber: number;
  values: Record<string, string>;
}

export async function parseExcelBuffer(
  buffer: Buffer
): Promise<{ rows: ParsedRow[]; unrecognizedHeaders: string[] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("The uploaded file has no worksheets");
  }

  const headerRow = worksheet.getRow(1);
  const columnMap: Record<number, string> = {}; // column index -> internal field key
  const unrecognizedHeaders: string[] = [];

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const raw = String(cell.value ?? "").trim();
    if (!raw) return;
    const normalized = normalizeHeader(raw);
    const matchedKey = Object.entries(HEADER_ALIASES).find(([, aliases]) =>
      aliases.includes(normalized)
    )?.[0];
    if (matchedKey) {
      columnMap[colNumber] = matchedKey;
    } else {
      unrecognizedHeaders.push(raw);
    }
  });

  const rows: ParsedRow[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // header row already processed
    const values: Record<string, string> = {};
    let hasAnyValue = false;

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = columnMap[colNumber];
      if (!key) return;
      const value = cell.value;
      let stringValue = "";
      if (value === null || value === undefined) {
        stringValue = "";
      } else if (typeof value === "object" && "text" in (value as object)) {
        stringValue = String((value as { text: unknown }).text ?? "");
      } else if (typeof value === "object" && "result" in (value as object)) {
        stringValue = String((value as { result: unknown }).result ?? "");
      } else {
        stringValue = String(value);
      }
      stringValue = stringValue.trim();
      if (stringValue) hasAnyValue = true;
      values[key] = stringValue;
    });

    if (hasAnyValue) {
      rows.push({ rowNumber, values });
    }
  });

  return { rows, unrecognizedHeaders };
}

export interface ImportRowError {
  rowNumber: number;
  error: string;
  title?: string;
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  failedRows: ImportRowError[];
  unrecognizedHeaders: string[];
}

// Find-or-create helpers, scoped to this import. Unlike the earlier
// per-row-lookup approach, this preloads everything that already exists in
// one query per entity type up front, so a 5,000-row import does a handful
// of queries for lookups instead of thousands of individual round trips to
// the database - the main cause of slow imports.
class LookupCache {
  private authors = new Map<string, string>();
  private publishers = new Map<string, string>();
  private categories = new Map<string, string>();
  private floors = new Map<string, string>();
  private rooms = new Map<string, string>(); // key: floorId::name
  private shelves = new Map<string, string>(); // key: roomId::name

  async preload(): Promise<void> {
    const [authors, publishers, categories, floors, rooms, shelves] = await Promise.all([
      prisma.author.findMany({ select: { id: true, name: true } }),
      prisma.publisher.findMany({ select: { id: true, name: true } }),
      prisma.category.findMany({ select: { id: true, name: true } }),
      prisma.floor.findMany({ select: { id: true, name: true } }),
      prisma.room.findMany({ select: { id: true, name: true, floorId: true } }),
      prisma.shelf.findMany({ select: { id: true, name: true, roomId: true } }),
    ]) as [
      { id: string; name: string }[],
      { id: string; name: string }[],
      { id: string; name: string }[],
      { id: string; name: string }[],
      { id: string; name: string; floorId: string }[],
      { id: string; name: string; roomId: string }[],
    ];
    authors.forEach((a) => this.authors.set(a.name.toLowerCase(), a.id));
    publishers.forEach((p) => this.publishers.set(p.name.toLowerCase(), p.id));
    categories.forEach((c) => this.categories.set(c.name.toLowerCase(), c.id));
    floors.forEach((f) => this.floors.set(f.name.toLowerCase(), f.id));
    rooms.forEach((r) => this.rooms.set(`${r.floorId}::${r.name.toLowerCase()}`, r.id));
    shelves.forEach((s) => this.shelves.set(`${s.roomId}::${s.name.toLowerCase()}`, s.id));
  }

  async findOrCreateAuthor(name: string): Promise<string> {
    const key = name.trim().toLowerCase();
    if (this.authors.has(key)) return this.authors.get(key)!;
    const record = await prisma.author.create({ data: { name: name.trim() } });
    this.authors.set(key, record.id);
    return record.id;
  }

  async findOrCreatePublisher(name: string): Promise<string> {
    const key = name.trim().toLowerCase();
    if (this.publishers.has(key)) return this.publishers.get(key)!;
    const record = await prisma.publisher.create({ data: { name: name.trim() } });
    this.publishers.set(key, record.id);
    return record.id;
  }

  async findOrCreateCategory(name: string): Promise<string> {
    const key = name.trim().toLowerCase();
    if (this.categories.has(key)) return this.categories.get(key)!;
    const record = await prisma.category.create({ data: { name: name.trim() } });
    this.categories.set(key, record.id);
    return record.id;
  }

  async findOrCreateFloor(name: string): Promise<string> {
    const key = name.trim().toLowerCase();
    if (this.floors.has(key)) return this.floors.get(key)!;
    const record = await prisma.floor.create({ data: { name: name.trim() } });
    this.floors.set(key, record.id);
    return record.id;
  }

  async findOrCreateRoom(floorId: string, name: string): Promise<string> {
    const key = `${floorId}::${name.trim().toLowerCase()}`;
    if (this.rooms.has(key)) return this.rooms.get(key)!;
    const record = await prisma.room.create({ data: { floorId, name: name.trim() } });
    this.rooms.set(key, record.id);
    return record.id;
  }

  async findOrCreateShelf(roomId: string, name: string): Promise<string> {
    const key = `${roomId}::${name.trim().toLowerCase()}`;
    if (this.shelves.has(key)) return this.shelves.get(key)!;
    const record = await prisma.shelf.create({ data: { roomId, name: name.trim() } });
    this.shelves.set(key, record.id);
    return record.id;
  }
}

// Splits an array into fixed-size chunks, preserving order.
function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function importBooksFromRows(rows: ParsedRow[], addedById: string): Promise<ImportResult> {
  const cache = new LookupCache();
  await cache.preload();

  // Preload existing accession numbers once instead of one query per row.
  const existingBooks = (await prisma.book.findMany({ select: { accessionNumber: true } })) as {
    accessionNumber: string;
  }[];
  const existingAccessionNumbers = new Set(existingBooks.map((b) => b.accessionNumber));
  const seenInThisFile = new Set<string>();

  const failedRows: ImportRowError[] = [];

  interface BookCreateData {
    accessionNumber: string;
    isbn?: string;
    barcodeNumber?: string;
    title: string;
    subtitle?: string;
    authorId: string;
    publisherId: string;
    publicationYear?: number;
    edition?: string;
    volume?: string;
    categoryId: string;
    subject?: string;
    language: string;
    description?: string;
    keywords?: string;
    bookType: string;
    numberOfPages?: number;
    condition: string;
    locationId?: string;
    addedById: string;
  }

  interface ResolvedRow {
    rowNumber: number;
    data: BookCreateData;
  }
  const resolvedRows: ResolvedRow[] = [];

  // Pass 1: resolve every row's references sequentially. This is still fast
  // because the cache above means resolving an already-seen author/room/etc.
  // is a plain in-memory lookup - only genuinely new entities hit the
  // database, and doing that resolution sequentially (rather than
  // concurrently) avoids two rows racing to create the same new author twice.
  for (const { rowNumber, values } of rows) {
    try {
      const title = values.title;
      const accessionNumber = values.accessionNumber;
      const bookTypeRaw = values.bookType;

      if (!title) throw new Error("Title is required");
      if (!accessionNumber) throw new Error("Accession Number is required");
      if (!bookTypeRaw) throw new Error("Book Type is required");

      if (existingAccessionNumbers.has(accessionNumber) || seenInThisFile.has(accessionNumber)) {
        throw new Error(`Accession number "${accessionNumber}" already exists`);
      }
      seenInThisFile.add(accessionNumber);

      const bookType = normalizeBookType(bookTypeRaw);
      if (!bookType) {
        throw new Error(
          `Unrecognized Book Type "${bookTypeRaw}" (expected e.g. "Law Book", "Bare Act", "Case Law", "Journal", "Manual", "Commentary", "Research Paper", "Reference Book")`
        );
      }

      const authorId = values.authorName
        ? await cache.findOrCreateAuthor(values.authorName)
        : await cache.findOrCreateAuthor("Unknown");
      const publisherId = values.publisherName
        ? await cache.findOrCreatePublisher(values.publisherName)
        : await cache.findOrCreatePublisher("Unknown");
      const categoryId = values.categoryName
        ? await cache.findOrCreateCategory(values.categoryName)
        : await cache.findOrCreateCategory("Uncategorized");

      let condition = "NEW";
      if (values.condition) {
        const normalized = normalizeCondition(values.condition);
        if (!normalized) {
          throw new Error(`Unrecognized Condition "${values.condition}" (expected New, Good, Worn, or Damaged)`);
        }
        condition = normalized;
      }

      let locationId: string | undefined;
      if (values.floorName && values.roomName && values.shelfName && values.row && values.position) {
        const floorId = await cache.findOrCreateFloor(values.floorName);
        const roomId = await cache.findOrCreateRoom(floorId, values.roomName);
        const shelfId = await cache.findOrCreateShelf(roomId, values.shelfName);
        const location = await prisma.bookLocation.create({
          data: { shelfId, row: values.row, position: values.position },
        });
        locationId = location.id;
      }

      resolvedRows.push({
        rowNumber,
        data: {
          accessionNumber,
          isbn: values.isbn || undefined,
          barcodeNumber: values.barcodeNumber || undefined,
          title,
          subtitle: values.subtitle || undefined,
          authorId,
          publisherId,
          publicationYear: values.publicationYear ? parseInt(values.publicationYear, 10) || undefined : undefined,
          edition: values.edition || undefined,
          volume: values.volume || undefined,
          categoryId,
          subject: values.subject || undefined,
          language: values.language || "English",
          description: values.description || undefined,
          keywords: values.keywords || undefined,
          bookType,
          numberOfPages: values.numberOfPages ? parseInt(values.numberOfPages, 10) || undefined : undefined,
          condition,
          locationId,
          addedById,
        },
      });
    } catch (err) {
      failedRows.push({
        rowNumber,
        title: values.title,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  // Pass 2: create the actual book records concurrently in batches. Each
  // row's references are already resolved, so there's no shared state to
  // race on here - this is where most of the wall-clock time was going
  // before, and running these in parallel batches (rather than one at a
  // time) is what actually speeds up a large import.
  const BATCH_SIZE = 25;
  let successCount = 0;
  for (const batch of chunk(resolvedRows, BATCH_SIZE)) {
    const results = await Promise.allSettled(
      batch.map((row) => prisma.book.create({ data: row.data as never }))
    );
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        successCount++;
      } else {
        const row = batch[i];
        failedRows.push({
          rowNumber: row.rowNumber,
          title: String(row.data.title ?? ""),
          error: result.reason instanceof Error ? result.reason.message : "Failed to create this book",
        });
      }
    });
  }

  // Keep failedRows sorted by original row number for a readable report.
  failedRows.sort((a, b) => a.rowNumber - b.rowNumber);

  return {
    totalRows: rows.length,
    successCount,
    failedRows,
    unrecognizedHeaders: [],
  };
}

export async function generateImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Books");

  const headers = [
    "Accession Number",
    "ISBN",
    "Barcode Number",
    "Title",
    "Subtitle",
    "Author",
    "Publisher",
    "Publication Year",
    "Edition",
    "Volume",
    "Category",
    "Subject",
    "Language",
    "Description",
    "Keywords",
    "Book Type",
    "Number Of Pages",
    "Condition",
    "Floor",
    "Room",
    "Shelf",
    "Row",
    "Position",
  ];
  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };

  sheet.addRow([
    "ACC-05001",
    "978-93-1234-567-8",
    "BC100500",
    "Example: Law of Contracts",
    "",
    "Avtar Singh",
    "Eastern Book Company",
    "2020",
    "5th Edition",
    "",
    "Contract Law",
    "Contract Law",
    "English",
    "",
    "contracts, agreements",
    "Law Book",
    "450",
    "Good",
    "Floor 1",
    "Room A",
    "Shelf S1",
    "Row 2",
    "Position 5",
  ]);

  sheet.columns.forEach((col) => {
    col.width = 20;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
