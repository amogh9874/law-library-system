import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useFloors, useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from "@/hooks/useStructure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import { getErrorMessage } from "@/lib/api";
import { Room } from "@/types";

export function RoomsPage() {
  const { toast } = useToast();
  const { data: floors } = useFloors();
  const { data: rooms, isLoading } = useRooms();

  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Room | null>(null);
  const [formName, setFormName] = useState("");
  const [formFloorId, setFormFloorId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

  function openCreate() {
    setEditTarget(null);
    setFormName("");
    setFormFloorId(floors?.[0]?.id ?? "");
    setDialogOpen(true);
  }

  function openEdit(room: Room) {
    setEditTarget(room);
    setFormName(room.name);
    setFormFloorId(room.floorId);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formName.trim() || !formFloorId) return;
    try {
      if (editTarget) {
        await updateRoom.mutateAsync({ id: editTarget.id, name: formName.trim() });
        toast("Room updated successfully", "success");
      } else {
        await createRoom.mutateAsync({ name: formName.trim(), floorId: formFloorId });
        toast("Room added successfully", "success");
      }
      setDialogOpen(false);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteRoom.mutateAsync(deleteTarget.id);
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
          <h1 className="font-display text-2xl font-semibold text-foreground">Rooms</h1>
          <p className="text-sm text-muted-foreground">{rooms?.length ?? "—"} rooms across all floors</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Room
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Room</th>
              <th className="px-4 py-3 font-medium">Floor</th>
              <th className="px-4 py-3 font-medium">Shelves</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Loading rooms...
                </td>
              </tr>
            )}
            {rooms?.map((room) => (
              <tr key={room.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium text-foreground">{room.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{room.floor?.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{room._count?.shelves ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(room)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(room)}
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
            <DialogTitle>{editTarget ? "Edit Room" : "Add Room"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Floor</Label>
              <Select value={formFloorId} onValueChange={setFormFloorId} disabled={!!editTarget}>
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
              <Label htmlFor="room-name">Room Name</Label>
              <Input id="room-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Room D" autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={createRoom.isPending || updateRoom.isPending}>
              {createRoom.isPending || updateRoom.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this room?"
        description={`"${deleteTarget?.name}" will be permanently removed. This fails safely if it still has shelves assigned.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteRoom.isPending}
      />
    </div>
  );
}
