import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, ClipboardList, AlertTriangle, Wrench, Users2 } from "lucide-react";
import { api } from "@/lib/api";
import { Book, BorrowRecord, ActivityLog, PaginatedResponse } from "@/types";
import { BookStatusBadge } from "@/components/ui/badge";
import { formatDistanceToNow } from "@/lib/date";

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: typeof BookOpen;
  isLoading: boolean;
}

function StatCard({ label, value, icon: Icon, isLoading }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-card-foreground">
        {isLoading ? "—" : value ?? 0}
      </p>
    </div>
  );
}

async function fetchBookCount(status?: string): Promise<number> {
  const { data } = await api.get<PaginatedResponse<Book>>("/books", {
    params: { pageSize: 1, ...(status ? { status } : {}) },
  });
  return data.pagination.totalCount;
}

export function DashboardPage() {
  const totalBooks = useQuery({ queryKey: ["stats", "books", "all"], queryFn: () => fetchBookCount() });
  const availableBooks = useQuery({
    queryKey: ["stats", "books", "AVAILABLE"],
    queryFn: () => fetchBookCount("AVAILABLE"),
  });
  const issuedBooks = useQuery({
    queryKey: ["stats", "books", "ISSUED"],
    queryFn: () => fetchBookCount("ISSUED"),
  });
  const lostBooks = useQuery({
    queryKey: ["stats", "books", "LOST"],
    queryFn: () => fetchBookCount("LOST"),
  });
  const damagedBooks = useQuery({
    queryKey: ["stats", "books", "DAMAGED"],
    queryFn: () => fetchBookCount("DAMAGED"),
  });
  const totalEmployees = useQuery({
    queryKey: ["stats", "employees"],
    queryFn: async () => {
      const { data } = await api.get("/employees", { params: { pageSize: 1 } });
      return data.pagination.totalCount as number;
    },
  });

  const recentBooks = useQuery({
    queryKey: ["dashboard", "recent-books"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Book>>("/books", {
        params: { pageSize: 5, sortBy: "createdAt", sortOrder: "desc" },
      });
      return data.data;
    },
  });

  const recentBorrows = useQuery({
    queryKey: ["dashboard", "recent-borrows"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<BorrowRecord>>("/borrow-records", {
        params: { pageSize: 5 },
      });
      return data.data;
    },
  });

  const recentActivity = useQuery({
    queryKey: ["dashboard", "recent-activity"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ActivityLog>>("/activity-logs", {
        params: { pageSize: 8 },
      });
      return data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of the library's current state</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Books" value={totalBooks.data} icon={BookOpen} isLoading={totalBooks.isLoading} />
        <StatCard
          label="Available"
          value={availableBooks.data}
          icon={CheckCircle2}
          isLoading={availableBooks.isLoading}
        />
        <StatCard label="Issued" value={issuedBooks.data} icon={ClipboardList} isLoading={issuedBooks.isLoading} />
        <StatCard label="Lost" value={lostBooks.data} icon={AlertTriangle} isLoading={lostBooks.isLoading} />
        <StatCard label="Damaged" value={damagedBooks.data} icon={Wrench} isLoading={damagedBooks.isLoading} />
        <StatCard
          label="Employees"
          value={totalEmployees.data}
          icon={Users2}
          isLoading={totalEmployees.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card lg:col-span-1">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-card-foreground">Recently Added Books</h2>
          </div>
          <div className="divide-y divide-border">
            {recentBooks.isLoading && <p className="px-5 py-4 text-sm text-muted-foreground">Loading...</p>}
            {recentBooks.data?.length === 0 && (
              <p className="px-5 py-4 text-sm text-muted-foreground">No books added yet.</p>
            )}
            {recentBooks.data?.map((book) => (
              <Link
                key={book.id}
                to={`/books/${book.id}`}
                className="block px-5 py-3 hover:bg-muted"
              >
                <p className="truncate text-sm font-medium text-card-foreground">{book.title}</p>
                <p className="text-xs text-muted-foreground">{book.accessionNumber} · {book.author?.name}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card lg:col-span-1">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-card-foreground">Recently Issued Books</h2>
          </div>
          <div className="divide-y divide-border">
            {recentBorrows.isLoading && <p className="px-5 py-4 text-sm text-muted-foreground">Loading...</p>}
            {recentBorrows.data?.length === 0 && (
              <p className="px-5 py-4 text-sm text-muted-foreground">No borrow records yet.</p>
            )}
            {recentBorrows.data?.map((record) => (
              <div key={record.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-card-foreground">{record.book.title}</p>
                  <BookStatusBadge status={record.status} />
                </div>
                <p className="text-xs text-muted-foreground">to {record.employee.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card lg:col-span-1">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-card-foreground">Recent Activity</h2>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.isLoading && <p className="px-5 py-4 text-sm text-muted-foreground">Loading...</p>}
            {recentActivity.data?.length === 0 && (
              <p className="px-5 py-4 text-sm text-muted-foreground">No activity recorded yet.</p>
            )}
            {recentActivity.data?.map((log) => (
              <div key={log.id} className="px-5 py-3">
                <p className="text-sm text-card-foreground">
                  {log.action.replace(/_/g, " ").toLowerCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {log.user?.email ?? "System"} · {formatDistanceToNow(log.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
