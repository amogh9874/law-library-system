import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, RotateCw, Undo2, AlertTriangle } from "lucide-react";
import { useBorrowRecords, useReturnBook, useRenewBook, useMarkBorrowLost } from "@/hooks/useBorrowRecords";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BorrowStatusBadge } from "@/components/ui/badge";
import { Pagination } from "@/components/Pagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { IssueBookDialog } from "./IssueBookDialog";
import { useToast } from "@/context/ToastContext";
import { getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { BorrowRecord } from "@/types";

const PAGE_SIZE = 20;

export function BorrowRecordsListPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [renewTarget, setRenewTarget] = useState<BorrowRecord | null>(null);
  const [newDueDate, setNewDueDate] = useState("");
  const [lostTarget, setLostTarget] = useState<BorrowRecord | null>(null);

  const { data, isLoading } = useBorrowRecords({
    status: status || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const returnBook = useReturnBook();
  const renewBook = useRenewBook();
  const markLost = useMarkBorrowLost();

  async function handleReturn(record: BorrowRecord) {
    try {
      await returnBook.mutateAsync(record.id);
      toast(`"${record.book.title}" marked as returned`, "success");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  }

  function openRenewDialog(record: BorrowRecord) {
    const d = new Date(record.dueDate);
    d.setDate(d.getDate() + 14);
    setNewDueDate(d.toISOString().slice(0, 10));
    setRenewTarget(record);
  }

  async function handleRenewConfirm() {
    if (!renewTarget) return;
    try {
      await renewBook.mutateAsync({ id: renewTarget.id, newDueDate: new Date(newDueDate).toISOString() });
      toast(`"${renewTarget.book.title}" renewed`, "success");
      setRenewTarget(null);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  }

  async function handleMarkLostConfirm() {
    if (!lostTarget) return;
    try {
      await markLost.mutateAsync(lostTarget.id);
      toast(`"${lostTarget.book.title}" marked as lost`, "success");
      setLostTarget(null);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Borrow Records</h1>
          <p className="text-sm text-muted-foreground">{data?.pagination.totalCount ?? "—"} records</p>
        </div>
        <Button onClick={() => setIssueDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Issue Book
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <Select
          value={status || "ALL"}
          onValueChange={(v) => {
            setStatus(v === "ALL" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ISSUED">Issued</SelectItem>
            <SelectItem value="RETURNED">Returned</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="LOST">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Book</th>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Issue Date</th>
              <th className="px-4 py-3 font-medium">Due Date</th>
              <th className="px-4 py-3 font-medium">Return Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Loading borrow records...
                </td>
              </tr>
            )}
            {data?.data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No borrow records found.
                </td>
              </tr>
            )}
            {data?.data.map((record) => {
              const isActive = record.status === "ISSUED" || record.status === "OVERDUE";
              return (
                <tr key={record.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link to={`/books/${record.book.id}`} className="font-medium text-foreground hover:text-accent">
                      {record.book.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{record.employee.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(record.issueDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(record.dueDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {record.returnDate ? formatDate(record.returnDate) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <BorrowStatusBadge status={record.status} />
                  </td>
                  <td className="px-4 py-3">
                    {isActive && (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleReturn(record)}>
                          <Undo2 className="h-3.5 w-3.5" />
                          Return
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openRenewDialog(record)}>
                          <RotateCw className="h-3.5 w-3.5" />
                          Renew
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLostTarget(record)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Mark Lost
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data && (
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            totalCount={data.pagination.totalCount}
            pageSize={data.pagination.pageSize}
            onPageChange={setPage}
          />
        )}
      </div>

      <IssueBookDialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen} />

      <ConfirmDialog
        open={!!renewTarget}
        onOpenChange={(open) => !open && setRenewTarget(null)}
        title="Renew this book?"
        description={
          <div className="space-y-2">
            <p>Extend the due date for "{renewTarget?.book.title}".</p>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        }
        confirmLabel="Renew"
        onConfirm={handleRenewConfirm}
        isConfirming={renewBook.isPending}
      />

      <ConfirmDialog
        open={!!lostTarget}
        onOpenChange={(open) => !open && setLostTarget(null)}
        title="Mark this book as lost?"
        description={`"${lostTarget?.book.title}" will be marked as lost and its status updated accordingly.`}
        confirmLabel="Mark Lost"
        variant="destructive"
        onConfirm={handleMarkLostConfirm}
        isConfirming={markLost.isPending}
      />
    </div>
  );
}
