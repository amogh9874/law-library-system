import { useState } from "react";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import {
  useCatalogPage,
  useCreateCatalogEntry,
  useUpdateCatalogEntry,
  useDeleteCatalogEntry,
} from "@/hooks/useCatalogPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/Pagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/context/ToastContext";
import { getErrorMessage } from "@/lib/api";
import { NamedEntity } from "@/types";

interface CatalogPageProps {
  endpoint: string;
  title: string;
  singularLabel: string;
  searchPlaceholder: string;
}

export function CatalogPage({ endpoint, title, singularLabel, searchPlaceholder }: CatalogPageProps) {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editTarget, setEditTarget] = useState<NamedEntity | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formValue, setFormValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<NamedEntity | null>(null);

  const { data, isLoading } = useCatalogPage(endpoint, search, page);
  const createEntry = useCreateCatalogEntry(endpoint);
  const updateEntry = useUpdateCatalogEntry(endpoint);
  const deleteEntry = useDeleteCatalogEntry(endpoint);

  function openCreate() {
    setFormValue("");
    setIsCreating(true);
  }

  function openEdit(entry: NamedEntity) {
    setFormValue(entry.name);
    setEditTarget(entry);
  }

  async function handleSave() {
    if (!formValue.trim()) return;
    try {
      if (editTarget) {
        await updateEntry.mutateAsync({ id: editTarget.id, name: formValue.trim() });
        toast(`${singularLabel} updated successfully`, "success");
        setEditTarget(null);
      } else {
        await createEntry.mutateAsync(formValue.trim());
        toast(`${singularLabel} added successfully`, "success");
        setIsCreating(false);
      }
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteEntry.mutateAsync(deleteTarget.id);
      toast(`${deleteTarget.name} deleted successfully`, "success");
      setDeleteTarget(null);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  }

  const dialogOpen = isCreating || !!editTarget;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{data?.pagination.totalCount ?? "—"} entries</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add {singularLabel}
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearch(searchInput);
                setPage(1);
              }
            }}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            )}
            {data?.data.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-12 text-center text-muted-foreground">
                  No {title.toLowerCase()} yet.
                </td>
              </tr>
            )}
            {data?.data.map((entry) => (
              <tr key={entry.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium text-foreground">{entry.name}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(entry)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(entry)}
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
            onPageChange={setPage}
          />
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setEditTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? `Edit ${singularLabel}` : `Add ${singularLabel}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="catalog-name">Name</Label>
            <Input
              id="catalog-name"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setEditTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={createEntry.isPending || updateEntry.isPending}>
              {createEntry.isPending || updateEntry.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete this ${singularLabel.toLowerCase()}?`}
        description={`"${deleteTarget?.name}" will be permanently removed. This fails safely if any books still reference it.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteEntry.isPending}
      />
    </div>
  );
}
