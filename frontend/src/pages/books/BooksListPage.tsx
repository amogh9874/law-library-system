import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Search, Plus, ArrowUpDown, Trash2, Eye, Pencil, FileUp } from "lucide-react";
import { useBooks, useDeleteBook, useBulkDeleteBooks } from "@/hooks/useBooks";
import { useAuthors, usePublishers, useCategories } from "@/hooks/useCatalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BookStatusBadge } from "@/components/ui/badge";
import { Pagination } from "@/components/Pagination";
import { LocationTag } from "@/components/LocationTag";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ImportBooksDialog } from "./ImportBooksDialog";
import { useToast } from "@/context/ToastContext";
import { getErrorMessage } from "@/lib/api";
import { BOOK_TYPE_LABELS } from "@/lib/constants";

const PAGE_SIZE = 20;

export function BooksListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const search = searchParams.get("search") || "";
  const bookType = searchParams.get("bookType") || "";
  const status = searchParams.get("status") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const sortBy = searchParams.get("sortBy") || "title";
  const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";

  const [searchInput, setSearchInput] = useState(search);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  const { data: categories } = useCategories();
  useAuthors();
  usePublishers();

  const { data, isLoading } = useBooks({
    search: search || undefined,
    bookType: bookType || undefined,
    status: status || undefined,
    categoryId: categoryId || undefined,
    page,
    pageSize: PAGE_SIZE,
    sortBy,
    sortOrder,
  });

  const deleteBook = useDeleteBook();
  const bulkDeleteBooks = useBulkDeleteBooks();

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    // Changing a filter should reset back to page 1, but changing the page
    // itself (e.g. clicking Next) must not immediately override that change.
    if (key !== "page") {
      next.set("page", "1");
    }
    setSearchParams(next);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("search", searchInput);
  }

  function toggleSort(field: string) {
    const next = new URLSearchParams(searchParams);
    if (sortBy === field) {
      next.set("sortOrder", sortOrder === "asc" ? "desc" : "asc");
    } else {
      next.set("sortBy", field);
      next.set("sortOrder", "asc");
    }
    setSearchParams(next);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteBook.mutateAsync(deleteTarget.id);
      toast(`"${deleteTarget.title}" deleted successfully`, "success");
      setDeleteTarget(null);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    if (!data) return;
    const allSelected = data.data.every((b) => selectedIds.has(b.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        data.data.forEach((b) => next.delete(b.id));
      } else {
        data.data.forEach((b) => next.add(b.id));
      }
      return next;
    });
  }

  async function handleBulkDeleteConfirm() {
    const ids = Array.from(selectedIds);
    try {
      const result = await bulkDeleteBooks.mutateAsync(ids);
      if (result.successCount > 0) {
        toast(`${result.successCount} of ${ids.length} books deleted successfully`, "success");
      }
      if (result.failed.length > 0) {
        toast(`${result.failed.length} book(s) could not be deleted (e.g. currently issued)`, "error");
      }
      setSelectedIds(new Set());
      setBulkDeleteConfirmOpen(false);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Books</h1>
          <p className="text-sm text-muted-foreground">
            {data?.pagination.totalCount ?? "—"} books in the collection
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 ? (
            <>
              <Button variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Clear selection
              </Button>
              <Button variant="destructive" onClick={() => setBulkDeleteConfirmOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedIds.size})
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <FileUp className="h-4 w-4" />
                Import from Excel
              </Button>
              <Button onClick={() => navigate("/books/new")}>
                <Plus className="h-4 w-4" />
                Add Book
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <form onSubmit={handleSearchSubmit} className="mb-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, ISBN, accession no., barcode, author, subject, keywords..."
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <Select value={bookType || "ALL"} onValueChange={(v) => updateParam("bookType", v === "ALL" ? "" : v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Book Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Book Types</SelectItem>
              {Object.entries(BOOK_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status || "ALL"} onValueChange={(v) => updateParam("status", v === "ALL" ? "" : v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="ISSUED">Issued</SelectItem>
              <SelectItem value="LOST">Lost</SelectItem>
              <SelectItem value="DAMAGED">Damaged</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={categoryId || "ALL"}
            onValueChange={(v) => updateParam("categoryId", v === "ALL" ? "" : v)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(bookType || status || categoryId || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchParams({})}
              className="text-muted-foreground"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-10 px-4 py-3">
                <Checkbox
                  checked={!!data?.data.length && data.data.every((b) => selectedIds.has(b.id))}
                  onCheckedChange={toggleSelectAllOnPage}
                  aria-label="Select all books on this page"
                />
              </th>
              <SortableHeader label="Accession No." field="accessionNumber" current={sortBy} order={sortOrder} onSort={toggleSort} />
              <SortableHeader label="Title" field="title" current={sortBy} order={sortOrder} onSort={toggleSort} />
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Loading books...
                </td>
              </tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  No books match your search. Try adjusting filters or add a new book.
                </td>
              </tr>
            )}
            {data?.data.map((book) => (
              <tr key={book.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selectedIds.has(book.id)}
                    onCheckedChange={() => toggleSelectOne(book.id)}
                    aria-label={`Select ${book.title}`}
                  />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{book.accessionNumber}</td>
                <td className="px-4 py-3">
                  <Link to={`/books/${book.id}`} className="font-medium text-foreground hover:text-accent">
                    {book.title}
                  </Link>
                  {book.subtitle && <p className="text-xs text-muted-foreground">{book.subtitle}</p>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{book.author?.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{book.category?.name}</td>
                <td className="px-4 py-3">
                  <BookStatusBadge status={book.status} />
                </td>
                <td className="px-4 py-3">
                  <LocationTag location={book.location} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/books/${book.id}`)} aria-label="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/books/${book.id}/edit`)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget({ id: book.id, title: book.title })}
                      aria-label="Delete"
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data && (
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            totalCount={data.pagination.totalCount}
            pageSize={data.pagination.pageSize}
            onPageChange={(p) => updateParam("page", String(p))}
          />
        )}
      </div>

      <ImportBooksDialog open={isImportOpen} onOpenChange={setIsImportOpen} />

      <ConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        title={`Delete ${selectedIds.size} selected book${selectedIds.size === 1 ? "" : "s"}?`}
        description="Each book will be moved to deleted books and can be restored later. Books currently issued will be skipped automatically."
        confirmLabel="Delete Selected"
        variant="destructive"
        onConfirm={handleBulkDeleteConfirm}
        isConfirming={bulkDeleteBooks.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this book?"
        description={`"${deleteTarget?.title}" will be moved to deleted books and can be restored later. This won't permanently erase its record.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteBook.isPending}
      />
    </div>
  );
}

function SortableHeader({
  label,
  field,
  current,
  order,
  onSort,
}: {
  label: string;
  field: string;
  current: string;
  order: "asc" | "desc";
  onSort: (field: string) => void;
}) {
  const isActive = current === field;
  return (
    <th className="px-4 py-3 font-medium">
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 hover:text-foreground"
      >
        {label}
        <ArrowUpDown className={`h-3 w-3 ${isActive ? "text-accent" : "opacity-40"}`} />
        {isActive && <span className="sr-only">{order === "asc" ? "ascending" : "descending"}</span>}
      </button>
    </th>
  );
}
