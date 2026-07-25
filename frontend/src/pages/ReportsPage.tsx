import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText, FileJson } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/context/ToastContext";

const REPORT_TYPES = [
  { value: "available-books", label: "Available Books" },
  { value: "issued-books", label: "Issued Books" },
  { value: "lost-books", label: "Lost Books" },
  { value: "damaged-books", label: "Damaged Books" },
  { value: "borrow-history", label: "Borrow History" },
  { value: "books-added", label: "Books Added" },
  { value: "books-removed", label: "Books Removed" },
];

const DATE_RANGE_TYPES = new Set(["borrow-history", "books-added", "books-removed"]);

export function ReportsPage() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("available-books");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const supportsDateRange = DATE_RANGE_TYPES.has(reportType);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", reportType, from, to],
    queryFn: async () => {
      const { data } = await api.get(`/reports/${reportType}`, {
        params: { format: "json", from: from || undefined, to: to || undefined },
      });
      return data as { count: number; data: Record<string, unknown>[] };
    },
  });

  async function handleExport(format: "csv" | "excel" | "pdf") {
    setIsExporting(true);
    try {
      const response = await api.get(`/reports/${reportType}`, {
        params: { format, from: from || undefined, to: to || undefined },
        responseType: "blob",
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ext = format === "excel" ? "xlsx" : format;
      a.href = url;
      a.download = `${reportType}-${new Date().toISOString().slice(0, 10)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast(`${format.toUpperCase()} exported successfully`, "success");
    } catch {
      toast("Failed to export report", "error");
    } finally {
      setIsExporting(false);
    }
  }

  const columns = data?.data[0] ? Object.keys(data.data[0]) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">Generate and export library reports</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {supportsDateRange && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="from">From</Label>
                <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to">To</Label>
                <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </>
          )}

          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")} disabled={isExporting}>
              <FileJson className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("excel")} disabled={isExporting}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} disabled={isExporting}>
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-card-foreground">
            {REPORT_TYPES.find((r) => r.value === reportType)?.label}
          </h2>
          <span className="text-xs text-muted-foreground">{data?.count ?? 0} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {columns.length > 0 && (
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  {columns.map((col) => (
                    <th key={col} className="whitespace-nowrap px-4 py-2 font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground">Loading report...</td>
                </tr>
              )}
              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td className="px-4 py-12 text-center text-muted-foreground">No data for this report.</td>
                </tr>
              )}
              {data?.data.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col} className="whitespace-nowrap px-4 py-2 text-foreground">
                      {formatCell(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end px-4 py-2">
          <Download className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
