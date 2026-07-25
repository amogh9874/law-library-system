import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, BookOpen, AlertTriangle, Wrench } from "lucide-react";
import { useBook, useMarkBookLost, useMarkBookDamaged } from "@/hooks/useBooks";
import { Button } from "@/components/ui/button";
import { BookStatusBadge, BorrowStatusBadge, Badge } from "@/components/ui/badge";
import { LocationTag } from "@/components/LocationTag";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import { getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { BOOK_TYPE_LABELS, BOOK_CONDITION_LABELS } from "@/lib/constants";

export function BookDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: book, isLoading } = useBook(id);
  const markLost = useMarkBookLost();
  const markDamaged = useMarkBookDamaged();

  const [confirmAction, setConfirmAction] = useState<"lost" | "damaged" | null>(null);

  async function handleConfirm() {
    if (!id || !confirmAction) return;
    try {
      if (confirmAction === "lost") {
        await markLost.mutateAsync(id);
        toast("Book marked as lost", "success");
      } else {
        await markDamaged.mutateAsync(id);
        toast("Book marked as damaged", "success");
      }
      setConfirmAction(null);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading book...</p>;
  }

  if (!book) {
    return <p className="text-sm text-muted-foreground">Book not found.</p>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/books" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Books
          </Link>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/books/${id}/edit`)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          {book.status !== "LOST" && (
            <Button variant="outline" onClick={() => setConfirmAction("lost")}>
              <AlertTriangle className="h-4 w-4" />
              Mark Lost
            </Button>
          )}
          {book.status !== "DAMAGED" && (
            <Button variant="outline" onClick={() => setConfirmAction("damaged")}>
              <Wrench className="h-4 w-4" />
              Mark Damaged
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex gap-6">
          <div className="flex h-40 w-28 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
            {book.coverImageUrl ? (
              <img src={book.coverImageUrl} alt={book.title} className="h-full w-full rounded-md object-cover" />
            ) : (
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <h1 className="font-display text-2xl font-semibold text-foreground">{book.title}</h1>
              {book.subtitle && <p className="text-muted-foreground">{book.subtitle}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <BookStatusBadge status={book.status} />
              <Badge variant="muted">{BOOK_TYPE_LABELS[book.bookType]}</Badge>
              <Badge variant="muted">{BOOK_CONDITION_LABELS[book.condition]} condition</Badge>
            </div>

            <LocationTag location={book.location} />

            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 pt-2 text-sm sm:grid-cols-3">
              <DetailItem label="Author" value={book.author?.name} />
              <DetailItem label="Publisher" value={book.publisher?.name} />
              <DetailItem label="Category" value={book.category?.name} />
              <DetailItem label="Publication Year" value={book.publicationYear ?? "—"} />
              <DetailItem label="Edition" value={book.edition ?? "—"} />
              <DetailItem label="Volume" value={book.volume ?? "—"} />
              <DetailItem label="Language" value={book.language} />
              <DetailItem label="Pages" value={book.numberOfPages ?? "—"} />
              <DetailItem label="Subject" value={book.subject ?? "—"} />
              <DetailItem label="Accession No." value={book.accessionNumber} mono />
              <DetailItem label="ISBN" value={book.isbn ?? "—"} mono />
              <DetailItem label="Barcode" value={book.barcodeNumber ?? "—"} mono />
            </dl>

            {book.description && (
              <div className="pt-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
                <p className="mt-1 text-sm text-foreground">{book.description}</p>
              </div>
            )}

            <div className="flex gap-6 pt-2 text-xs text-muted-foreground">
              <span>Added {formatDate(book.createdAt)}</span>
              <span>Last updated {formatDate(book.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-card-foreground">Borrow History</h2>
        </div>
        {!book.borrowRecords?.length ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">This book has never been borrowed.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-2 font-medium">Employee</th>
                <th className="px-5 py-2 font-medium">Issue Date</th>
                <th className="px-5 py-2 font-medium">Due Date</th>
                <th className="px-5 py-2 font-medium">Return Date</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {book.borrowRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-5 py-3">{record.employee?.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(record.issueDate)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(record.dueDate)}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {record.returnDate ? formatDate(record.returnDate) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <BorrowStatusBadge status={record.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction === "lost" ? "Mark this book as lost?" : "Mark this book as damaged?"}
        description={
          confirmAction === "lost"
            ? "This book will be marked as lost and removed from availability."
            : "This book's condition and status will be updated to damaged."
        }
        confirmLabel={confirmAction === "lost" ? "Mark Lost" : "Mark Damaged"}
        variant="destructive"
        onConfirm={handleConfirm}
        isConfirming={markLost.isPending || markDamaged.isPending}
      />
    </div>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`text-foreground ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
