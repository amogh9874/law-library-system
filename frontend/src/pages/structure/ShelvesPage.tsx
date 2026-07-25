import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useFloors, useRooms, useAllShelves, useCreateShelf, useUpdateShelf, useDeleteShelf } from "@/hooks/useStructure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import { getErrorMessage } from "@/lib/api";
import { Shelf } from "@/types";

export function ShelvesPage() {
  const { toast } = useToast();
  const { data: floors } = useFloors();
  const { data: shelves, isLoading } = useAllShelves();

  const createShelf = useCreateShelf();
  const updateShelf = useUpdateShelf();
  const deleteShelf = useDeleteShelf();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Shelf | null>(null);
  const [formName, setFormName] = useState("");
  const [formFloorId, setFormFloorId] = useState("");
  const [formRoomId, setFormRoomId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Shelf | null>(null);

  const { data: roomsForFloor } = useRooms(formFloorId || undefined);

  function openCreate() {
    setEditTarget(null);
    setFormName("");
    setFormFloorId("");
    setFormRoomId("");
    setDialogOpen(true);
  }

  function openEdit(shelf: Shelf) {
    setEditTarget(shelf);
    setFormName(shelf.name);
    setFormFloorId(shelf.room?.floor.id ?? "");
    setFormRoomId(shelf.roomId);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formName.trim() || !formRoomId) return;
    try {
      if (editTarget) {
        await updateShelf.mutateAsync({ id: editTarget.id, name: formName.trim() });
        toast("Shelf updated successfully", "success");
      } else {
        await createShelf.mutateAsync({ name: formName.trim(), roomId: formRoomId });
        toast("Shelf added successfully", "success");
      }
      setDialogOpen(false);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteShelf.mutateAsync(deleteTarget.id);
      toast(`${deleteTarget.name} deleted successfully`, "success");
      setDeleteTarget(null);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Shelves</h1>
          <p className="text-sm text-muted-foreground">{shelves?.length ?? "—"} shelves across all rooms</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Shelf
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Shelf</th>
              <th className="px-4 py-3 font-medium">Room</th>
              <th className="px-4 py-3 font-medium">Floor</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Loading shelves...
                </td>
              </tr>
            )}
            {shelves?.map((shelf) => (
              <tr key={shelf.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium text-foreground">{shelf.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{shelf.room?.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{shelf.room?.floor.name}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(shelf)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(shelf)}
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
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Shelf" : "Add Shelf"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Floor</Label>
              <Select
                value={formFloorId}
                onValueChange={(v) => {
                  setFormFloorId(v);
                  setFormRoomId("");
                }}
                disabled={!!editTarget}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  {floors?.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Room</Label>
              <Select value={formRoomId} onValueChange={setFormRoomId} disabled={!formFloorId || !!editTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {roomsForFloor?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shelf-name">Shelf Name</Label>
              <Input id="shelf-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Shelf S5" autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={createShelf.isPending || updateShelf.isPending}>
              {createShelf.isPending || updateShelf.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this shelf?"
        description={`"${deleteTarget?.name}" will be permanently removed. This fails safely if it still has books assigned.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteShelf.isPending}
      />
    </div>
  );
}
