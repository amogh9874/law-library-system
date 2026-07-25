import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { Book, Employee, PaginatedResponse } from "@/types";
import { useIssueBook } from "@/hooks/useBorrowRecords";
import { useToast } from "@/context/ToastContext";
import { getErrorMessage } from "@/lib/api";
import { LocationTag } from "@/components/LocationTag";

interface IssueBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IssueBookDialog({ open, onOpenChange }: IssueBookDialogProps) {
  const { toast } = useToast();
  const issueBook = useIssueBook();

  const [bookSearch, setBookSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [remarks, setRemarks] = useState("");

  const { data: bookResults } = useQuery({
    queryKey: ["issue-dialog-books", bookSearch],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Book>>("/books", {
        params: { search: bookSearch || undefined, status: "AVAILABLE", pageSize: 6 },
      });
      return data.data;
    },
    enabled: open && !selectedBook,
  });

  const { data: employeeResults } = useQuery({
    queryKey: ["issue-dialog-employees", employeeSearch],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Employee>>("/employees", {
        params: { search: employeeSearch || undefined, pageSize: 6 },
      });
      return data.data.filter((e) => e.accountStatus === "ACTIVE");
    },
    enabled: open && !selectedEmployee,
  });

  function reset() {
    setBookSearch("");
    setSelectedBook(null);
    setEmployeeSearch("");
    setSelectedEmployee(null);
    setRemarks("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBook || !selectedEmployee) return;
    try {
      await issueBook.mutateAsync({
        bookId: selectedBook.id,
        employeeId: selectedEmployee.id,
        dueDate: new Date(dueDate).toISOString(),
        remarks: remarks || undefined,
      });
      toast(`"${selectedBook.title}" issued to ${selectedEmployee.name}`, "success");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Issue a Book</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Book</Label>
            {selectedBook ? (
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedBook.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedBook.accessionNumber}</p>
                  <div className="mt-1">
                    <LocationTag location={selectedBook.location} />
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedBook(null)}>
                  Change
                </Button>
              </div>
            ) : (
              <>
                <Input
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  placeholder="Search available books..."
                  autoFocus
                />
                <div className="max-h-40 overflow-y-auto rounded-md border border-border">
                  {bookResults?.length === 0 && (
                    <p className="p-3 text-xs text-muted-foreground">No available books match.</p>
                  )}
                  {bookResults?.map((book) => (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => setSelectedBook(book)}
                      className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span className="font-medium text-foreground">{book.title}</span>
                      <span className="text-xs text-muted-foreground">{book.accessionNumber} · {book.author?.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Employee</Label>
            {selectedEmployee ? (
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedEmployee.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedEmployee.employeeCode} · {selectedEmployee.department}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedEmployee(null)}>
                  Change
                </Button>
              </div>
            ) : (
              <>
                <Input
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="Search employees..."
                />
                <div className="max-h-40 overflow-y-auto rounded-md border border-border">
                  {employeeResults?.length === 0 && (
                    <p className="p-3 text-xs text-muted-foreground">No active employees match.</p>
                  )}
                  {employeeResults?.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setSelectedEmployee(emp)}
                      className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span className="font-medium text-foreground">{emp.name}</span>
                      <span className="text-xs text-muted-foreground">{emp.employeeCode} · {emp.department}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remarks">Remarks (optional)</Label>
            <Textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedBook || !selectedEmployee || issueBook.isPending}>
              {issueBook.isPending ? "Issuing..." : "Issue Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
