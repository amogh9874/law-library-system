import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ActivityLog, PaginatedResponse } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 30;

export function ActivityLogsPage() {
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["activity-logs", { module, action, page }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ActivityLog>>("/activity-logs", {
        params: { module: module || undefined, action: action || undefined, page, pageSize: PAGE_SIZE },
      });
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Activity Logs</h1>
        <p className="text-sm text-muted-foreground">{data?.pagination.totalCount ?? "—"} recorded actions</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="module-filter">Module</Label>
            <Input
              id="module-filter"
              value={module}
              onChange={(e) => {
                setModule(e.target.value);
                setPage(1);
              }}
              placeholder="e.g. Books"
              className="w-48"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="action-filter">Action</Label>
            <Input
              id="action-filter"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              placeholder="e.g. BOOK_ADDED"
              className="w-48"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Module</th>
              <th className="px-4 py-3 font-medium">Details</th>
              <th className="px-4 py-3 font-medium">Date &amp; Time</th>
              <th className="px-4 py-3 font-medium">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading activity logs...
                </td>
              </tr>
            )}
            {data?.data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No activity recorded yet.
                </td>
              </tr>
            )}
            {data?.data.map((log) => (
              <tr key={log.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 text-foreground">{log.user?.email ?? "System"}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.action}</td>
                <td className="px-4 py-3 text-muted-foreground">{log.module}</td>
                <td className="px-4 py-3 text-muted-foreground">{log.details ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ipAddress ?? "—"}</td>
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
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
