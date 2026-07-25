export type Role = "WEBSITE_OWNER" | "LIBRARY_ADMIN";
export type AccountStatus = "ACTIVE" | "INACTIVE";

export type BookType =
  | "LAW_BOOK"
  | "BARE_ACT"
  | "CASE_LAW"
  | "JOURNAL"
  | "MANUAL"
  | "COMMENTARY"
  | "RESEARCH_PAPER"
  | "REFERENCE_BOOK";

export type BookStatus = "AVAILABLE" | "ISSUED" | "LOST" | "DAMAGED";
export type BookCondition = "NEW" | "GOOD" | "WORN" | "DAMAGED";
export type BorrowStatus = "ISSUED" | "RETURNED" | "OVERDUE" | "LOST";

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
  accountStatus?: AccountStatus;
  lastLoginAt?: string | null;
  employee?: {
    id: string;
    employeeCode?: string;
    name: string;
    designation: string;
    department: string;
    officeLocation?: string;
    phoneNumber?: string;
  } | null;
}

export interface NamedEntity {
  id: string;
  name: string;
  createdAt: string;
}

export interface Floor {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  name: string;
  floorId: string;
  floor?: Floor;
  _count?: { shelves: number };
}

export interface Shelf {
  id: string;
  name: string;
  roomId: string;
  room?: Room & { floor: Floor };
}

export interface BookLocation {
  id: string;
  row: string;
  position: string;
  shelf: Shelf & { room: Room & { floor: Floor } };
}

export interface Book {
  id: string;
  accessionNumber: string;
  isbn?: string | null;
  barcodeNumber?: string | null;
  title: string;
  subtitle?: string | null;
  author: NamedEntity;
  authorId: string;
  publisher: NamedEntity;
  publisherId: string;
  publicationYear?: number | null;
  edition?: string | null;
  volume?: string | null;
  category: NamedEntity;
  categoryId: string;
  subject?: string | null;
  language: string;
  description?: string | null;
  keywords?: string | null;
  bookType: BookType;
  numberOfPages?: number | null;
  coverImageUrl?: string | null;
  location?: BookLocation | null;
  locationId?: string | null;
  status: BookStatus;
  condition: BookCondition;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  borrowRecords?: BorrowRecord[];
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  designation: string;
  department: string;
  officeLocation: string;
  email: string;
  phoneNumber: string;
  accountStatus: AccountStatus;
  user?: { id: string; role: Role; accountStatus: AccountStatus; email: string } | null;
}

export interface BorrowRecord {
  id: string;
  book: Book;
  bookId: string;
  employee: Employee;
  employeeId: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: BorrowStatus;
  remarks?: string | null;
}

export interface ActivityLog {
  id: string;
  action: string;
  module: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: { email: string; role: Role } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}
