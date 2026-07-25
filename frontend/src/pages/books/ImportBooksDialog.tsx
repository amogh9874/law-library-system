import { useRef, useState } from "react";
import { Upload, Download, CheckCircle2, AlertCircle, FileSpreadsheet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useImportBooks, downloadImportTemplate, fileToBase64, ImportResult } from "@/hooks/useImportBooks";
import { useToast } from "@/context/ToastContext";
import { getErrorMessage } from "@/lib/api";

interface ImportBooksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportBooksDialog({ open, onOpenChange }: ImportBooksDialogProps) {
  const { toast } = useToast();
  const importBooks = useImportBooks();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  function reset() {
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleTemplateDownload() {
    setIsDownloadingTemplate(true);
    try {
      await downloadImportTemplate();
    } catch {
      toast("Failed to download template", "error");
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  async function handleImport() {
    if (!selectedFile) return;
    try {
      const base64 = await fileToBase64(selectedFile);
      const res = await importBooks.mutateAsync(base64);
      setResult(res);
      if (res.successCount > 0) {
        toast(`${res.successCount} of ${res.totalRows} books imported successfully`, "success");
      }
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
          <DialogTitle>Import Books from Excel</DialogTitle>
          <DialogDescription>
            Upload a spreadsheet to add many books at once. Existing authors, publishers,
            categories, rooms, and shelves are matched by name — new ones are created
            automatically if they don't already exist.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={handleTemplateDownload} disabled={isDownloadingTemplate}>
              <Download className="h-4 w-4" />
              {isDownloadingTemplate ? "Downloading..." : "Download Template"}
            </Button>

            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-foreground">{selectedFile.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Only .xlsx files with the expected column headers are accepted
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Required columns: <span className="font-mono">Accession Number</span>,{" "}
              <span className="font-mono">Title</span>, <span className="font-mono">Book Type</span>.
              Everything else is optional. Rows with a duplicate accession number are skipped.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
              <p className="text-sm text-success">
                {result.successCount} of {result.totalRows} rows imported successfully.
              </p>
            </div>

            {result.unrecognizedHeaders.length > 0 && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                <p className="text-sm text-warning">
                  These columns weren't recognized and were ignored:{" "}
                  {result.unrecognizedHeaders.join(", ")}
                </p>
              </div>
            )}

            {result.failedRows.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {result.failedRows.length} row{result.failedRows.length === 1 ? "" : "s"} failed
                </p>
                <div className="max-h-48 overflow-y-auto rounded-md border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                        <th className="px-3 py-1.5 font-medium">Row</th>
                        <th className="px-3 py-1.5 font-medium">Title</th>
                        <th className="px-3 py-1.5 font-medium">Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {result.failedRows.map((f) => (
                        <tr key={f.rowNumber}>
                          <td className="px-3 py-1.5 text-muted-foreground">{f.rowNumber}</td>
                          <td className="px-3 py-1.5 text-foreground">{f.title || "—"}</td>
                          <td className="px-3 py-1.5 text-destructive">{f.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <>
              <Button variant="outline" onClick={reset}>
                Import Another File
              </Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!selectedFile || importBooks.isPending}>
                {importBooks.isPending ? "Importing..." : "Import"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
