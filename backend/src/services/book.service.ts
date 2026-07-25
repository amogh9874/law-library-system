import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { CreateBookInput, UpdateBookInput } from "../validators/book.validator";

const bookListInclude = {
  author: true,
  publisher: true,
  category: true,
  location: { include: { shelf: { include: { room: { include: { floor: true } } } } } },
} satisfies Prisma.BookInclude;

interface BookSearchFilters {
  search?: string;
  bookType?: string;
  status?: string;
  categoryId?: string;
  authorId?: string;
  publisherId?: string;
  roomId?: string;
  shelfId?: string;
}

function buildWhereClause(filters: BookSearchFilters): Prisma.BookWhereInput {
  const where: Prisma.BookWhereInput = { isDeleted: false };

  if (filters.search) {
    const q = filters.search;
    // Search across every field the spec requires: title, ISBN, accession
    // number, barcode, author, publisher, category, subject, keywords.
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { subtitle: { contains: q, mode: "insensitive" } },
      { isbn: { contains: q, mode: "insensitive" } },
      { accessionNumber: { contains: q, mode: "insensitive" } },
      { barcodeNumber: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { keywords: { contains: q, mode: "insensitive" } },
      { author: { name: { contains: q, mode: "insensitive" } } },
      { publisher: { name: { contains: q, mode: "insensitive" } } },
      { category: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (filters.bookType) where.bookType = filters.bookType as Prisma.BookWhereInput["bookType"];
  if (filters.status) where.status = filters.status as Prisma.BookWhereInput["status"];
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.authorId) where.authorId = filters.authorId;
  if (filters.publisherId) where.publisherId = filters.publisherId;

  if (filters.roomId || filters.shelfId) {
    where.location = {
      shelf: {
        id: filters.shelfId,
        roomId: filters.roomId,
      },
    };
  }

  return where;
}

export const bookService = {
  async search(
    filters: BookSearchFilters,
    skip: number,
    take: number,
    orderBy: Record<string, "asc" | "desc">
  ) {
    const where = buildWhereClause(filters);
    const [data, totalCount] = await Promise.all([
      prisma.book.findMany({ where, skip, take, orderBy, include: bookListInclude }),
      prisma.book.count({ where }),
    ]);
    return { data, totalCount };
  },

  async getById(id: string) {
    const book = await prisma.book.findFirst({
      where: { id, isDeleted: false },
      include: {
        ...bookListInclude,
        borrowRecords: {
          orderBy: { issueDate: "desc" },
          include: { employee: true },
        },
      },
    });
    if (!book) {
      throw new AppError("Book not found", 404);
    }
    return book;
  },

  // Lightweight lookup used internally by update/delete/status-change
  // operations, which only need a few scalar fields to do their job.
  // Using getById() (full joins + entire borrow history) here was the
  // main cause of slow saves - every edit was paying for a borrow-history
  // fetch it never used.
  async getBookForInternalCheck(id: string) {
    const book = await prisma.book.findFirst({
      where: { id, isDeleted: false },
      select: { id: true, title: true, accessionNumber: true, status: true, locationId: true },
    });
    if (!book) {
      throw new AppError("Book not found", 404);
    }
    return book;
  },

  async create(input: CreateBookInput, addedById: string) {
    let locationId: string | undefined;

    if (input.shelfId && input.row && input.position) {
      const shelf = await prisma.shelf.findUnique({ where: { id: input.shelfId } });
      if (!shelf) {
        throw new AppError("Shelf not found", 404);
      }
      const location = await prisma.bookLocation.create({
        data: { shelfId: input.shelfId, row: input.row, position: input.position },
      });
      locationId = location.id;
    }

    return prisma.book.create({
      data: {
        accessionNumber: input.accessionNumber,
        isbn: input.isbn,
        barcodeNumber: input.barcodeNumber,
        title: input.title,
        subtitle: input.subtitle,
        authorId: input.authorId,
        publisherId: input.publisherId,
        publicationYear: input.publicationYear,
        edition: input.edition,
        volume: input.volume,
        categoryId: input.categoryId,
        subject: input.subject,
        language: input.language || "English",
        description: input.description,
        keywords: input.keywords,
        bookType: input.bookType,
        numberOfPages: input.numberOfPages,
        coverImageUrl: input.coverImageUrl,
        condition: input.condition || "NEW",
        locationId,
        addedById,
      },
      include: bookListInclude,
    });
  },

  async update(id: string, input: UpdateBookInput) {
    const existing = await this.getBookForInternalCheck(id);

    let locationId: string | undefined | null = existing.locationId;

    // If new location fields are provided, update or create the location.
    if (input.shelfId && input.row && input.position) {
      if (existing.locationId) {
        await prisma.bookLocation.update({
          where: { id: existing.locationId },
          data: { shelfId: input.shelfId, row: input.row, position: input.position },
        });
      } else {
        const location = await prisma.bookLocation.create({
          data: { shelfId: input.shelfId, row: input.row, position: input.position },
        });
        locationId = location.id;
      }
    }

    return prisma.book.update({
      where: { id },
      data: {
        accessionNumber: input.accessionNumber,
        isbn: input.isbn,
        barcodeNumber: input.barcodeNumber,
        title: input.title,
        subtitle: input.subtitle,
        authorId: input.authorId,
        publisherId: input.publisherId,
        publicationYear: input.publicationYear,
        edition: input.edition,
        volume: input.volume,
        categoryId: input.categoryId,
        subject: input.subject,
        language: input.language,
        description: input.description,
        keywords: input.keywords,
        bookType: input.bookType,
        numberOfPages: input.numberOfPages,
        coverImageUrl: input.coverImageUrl,
        condition: input.condition,
        locationId,
      },
      include: bookListInclude,
    });
  },

  async softDelete(id: string) {
    const book = await this.getBookForInternalCheck(id);
    if (book.status === "ISSUED") {
      throw new AppError("Cannot delete a book that is currently issued", 409);
    }
    return prisma.book.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  },

  async bulkSoftDelete(ids: string[]) {
    const succeeded: { id: string; title: string }[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of ids) {
      try {
        const book = await this.softDelete(id);
        succeeded.push({ id, title: book.title });
      } catch (err) {
        failed.push({
          id,
          error: err instanceof AppError ? err.message : "Failed to delete this book",
        });
      }
    }

    return { successCount: succeeded.length, succeeded, failed };
  },

  async restore(id: string) {
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      throw new AppError("Book not found", 404);
    }
    if (!book.isDeleted) {
      throw new AppError("Book is not deleted", 400);
    }
    return prisma.book.update({
      where: { id },
      data: { isDeleted: false, deletedAt: null },
    });
  },

  async listDeleted(skip: number, take: number) {
    const where: Prisma.BookWhereInput = { isDeleted: true };
    const [data, totalCount] = await Promise.all([
      prisma.book.findMany({ where, skip, take, orderBy: { deletedAt: "desc" }, include: bookListInclude }),
      prisma.book.count({ where }),
    ]);
    return { data, totalCount };
  },

  async markLost(id: string) {
    const book = await this.getBookForInternalCheck(id);
    if (book.status === "ISSUED") {
      throw new AppError(
        "This book is currently issued. Mark the borrow record as lost instead, which will update the book status automatically.",
        409
      );
    }
    return prisma.book.update({ where: { id }, data: { status: "LOST" } });
  },

  async markDamaged(id: string) {
    await this.getBookForInternalCheck(id);
    return prisma.book.update({
      where: { id },
      data: { status: "DAMAGED", condition: "DAMAGED" },
    });
  },
};
