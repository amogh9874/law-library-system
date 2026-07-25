-- ============================================================
-- Law Library Management System — Initial Schema (raw SQL)
-- Run this directly via psql since it bypasses Prisma's
-- schema-engine binary entirely. Column names are camelCase
-- and quoted to exactly match what Prisma Client expects
-- (Prisma only lowercases/snake_cases names that have @map,
-- and none of the individual fields in schema.prisma do).
-- ============================================================

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------

CREATE TYPE "Role" AS ENUM ('WEBSITE_OWNER', 'LIBRARY_ADMIN');
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "BookType" AS ENUM ('LAW_BOOK', 'BARE_ACT', 'CASE_LAW', 'JOURNAL', 'MANUAL', 'COMMENTARY', 'RESEARCH_PAPER', 'REFERENCE_BOOK');
CREATE TYPE "BookStatus" AS ENUM ('AVAILABLE', 'ISSUED', 'LOST', 'DAMAGED');
CREATE TYPE "BookCondition" AS ENUM ('NEW', 'GOOD', 'WORN', 'DAMAGED');
CREATE TYPE "BorrowStatus" AS ENUM ('ISSUED', 'RETURNED', 'OVERDUE', 'LOST');

-- ------------------------------------------------------------
-- EMPLOYEES
-- ------------------------------------------------------------

CREATE TABLE "employees" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "employeeCode" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "designation" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "officeLocation" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE INDEX "employees_employeeCode_idx" ON "employees" ("employeeCode");
CREATE INDEX "employees_name_idx" ON "employees" ("name");
CREATE INDEX "employees_department_idx" ON "employees" ("department");

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------

CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "employeeId" TEXT UNIQUE REFERENCES "employees"("id"),
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE INDEX "users_email_idx" ON "users" ("email");
CREATE INDEX "users_role_idx" ON "users" ("role");

-- ------------------------------------------------------------
-- LIBRARY PHYSICAL STRUCTURE
-- ------------------------------------------------------------

CREATE TABLE "floors" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE TABLE "rooms" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "floorId" TEXT NOT NULL REFERENCES "floors"("id"),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  UNIQUE ("floorId", "name")
);
CREATE INDEX "rooms_name_idx" ON "rooms" ("name");

CREATE TABLE "shelves" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "roomId" TEXT NOT NULL REFERENCES "rooms"("id"),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  UNIQUE ("roomId", "name")
);
CREATE INDEX "shelves_name_idx" ON "shelves" ("name");

CREATE TABLE "book_locations" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shelfId" TEXT NOT NULL REFERENCES "shelves"("id"),
  "row" TEXT NOT NULL,
  "position" TEXT NOT NULL
);
CREATE INDEX "book_locations_shelfId_idx" ON "book_locations" ("shelfId");

-- ------------------------------------------------------------
-- CATALOG
-- ------------------------------------------------------------

CREATE TABLE "authors" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE INDEX "authors_name_idx" ON "authors" ("name");

CREATE TABLE "publishers" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE INDEX "publishers_name_idx" ON "publishers" ("name");

CREATE TABLE "categories" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE INDEX "categories_name_idx" ON "categories" ("name");

-- ------------------------------------------------------------
-- BOOKS
-- ------------------------------------------------------------

CREATE TABLE "books" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "accessionNumber" TEXT UNIQUE NOT NULL,
  "isbn" TEXT,
  "barcodeNumber" TEXT UNIQUE,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "authorId" TEXT NOT NULL REFERENCES "authors"("id"),
  "publisherId" TEXT NOT NULL REFERENCES "publishers"("id"),
  "publicationYear" INTEGER,
  "edition" TEXT,
  "volume" TEXT,
  "categoryId" TEXT NOT NULL REFERENCES "categories"("id"),
  "subject" TEXT,
  "language" TEXT NOT NULL DEFAULT 'English',
  "description" TEXT,
  "keywords" TEXT,
  "bookType" "BookType" NOT NULL,
  "numberOfPages" INTEGER,
  "coverImageUrl" TEXT,
  "locationId" TEXT UNIQUE REFERENCES "book_locations"("id"),
  "status" "BookStatus" NOT NULL DEFAULT 'AVAILABLE',
  "condition" "BookCondition" NOT NULL DEFAULT 'NEW',
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP(3),
  "addedById" TEXT REFERENCES "users"("id"),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE INDEX "books_title_idx" ON "books" ("title");
CREATE INDEX "books_isbn_idx" ON "books" ("isbn");
CREATE INDEX "books_accessionNumber_idx" ON "books" ("accessionNumber");
CREATE INDEX "books_barcodeNumber_idx" ON "books" ("barcodeNumber");
CREATE INDEX "books_authorId_idx" ON "books" ("authorId");
CREATE INDEX "books_publisherId_idx" ON "books" ("publisherId");
CREATE INDEX "books_categoryId_idx" ON "books" ("categoryId");
CREATE INDEX "books_bookType_idx" ON "books" ("bookType");
CREATE INDEX "books_status_idx" ON "books" ("status");
CREATE INDEX "books_keywords_idx" ON "books" ("keywords");
CREATE INDEX "books_isDeleted_idx" ON "books" ("isDeleted");

-- ------------------------------------------------------------
-- BORROW RECORDS
-- ------------------------------------------------------------

CREATE TABLE "borrow_records" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "bookId" TEXT NOT NULL REFERENCES "books"("id"),
  "employeeId" TEXT NOT NULL REFERENCES "employees"("id"),
  "issueDate" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "dueDate" TIMESTAMP(3) NOT NULL,
  "returnDate" TIMESTAMP(3),
  "status" "BorrowStatus" NOT NULL DEFAULT 'ISSUED',
  "issuedById" TEXT REFERENCES "users"("id"),
  "returnedById" TEXT REFERENCES "users"("id"),
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE INDEX "borrow_records_bookId_idx" ON "borrow_records" ("bookId");
CREATE INDEX "borrow_records_employeeId_idx" ON "borrow_records" ("employeeId");
CREATE INDEX "borrow_records_status_idx" ON "borrow_records" ("status");
CREATE INDEX "borrow_records_dueDate_idx" ON "borrow_records" ("dueDate");

-- ------------------------------------------------------------
-- ACTIVITY LOGS
-- ------------------------------------------------------------

CREATE TABLE "activity_logs" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES "users"("id"),
  "action" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "details" TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs" ("userId");
CREATE INDEX "activity_logs_action_idx" ON "activity_logs" ("action");
CREATE INDEX "activity_logs_module_idx" ON "activity_logs" ("module");
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs" ("createdAt");
