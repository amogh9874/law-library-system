import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, Eye, Pencil, Trash2, ShieldOff, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  useEmployees,
  useDeleteEmployee,
  useActivateEmployee,
  useDeactivateEmployee,
} from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/Pagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import { getErrorMessage } from "@/lib/api";

export function EmployeesListPage() {
  const { isOwner } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useEmployees(search, page);
  const deleteEmployee = useDeleteEmployee();
  const activate = useActivateEmployee();
  const deactivate = useDeactivateEmployee();

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteEmployee.mutateAsync(deleteTarget.id);
      toast(`${deleteTarget.name} deleted successfully`, "success");
      setDeleteTarget(null);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  }

  async function handleToggleStatus(id: string, isActive: boolean) {
    try {
      if (isActive) {
        await deactivate.mutateAsync(id);
        toast("Employee deactivated", "success");
      } else {
        await activate.mutateAsync(id);
        toast("Employee activated", "success");
      }
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground">
            {data?.pagination.totalCount ?? "—"} staff members
            {!isOwner && " · read-only view"}
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => navigate("/employees/new")}>
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        )}
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
            placeholder="Search by name, employee code, department, email..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Employee Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Designation</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Access</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Loading employees...
                </td>
              </tr>
            )}
            {data?.data.map((employee) => (
              <tr key={employee.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{employee.employeeCode}</td>
                <td className="px-4 py-3">
                  <Link to={`/employees/${employee.id}`} className="font-medium text-foreground hover:text-accent">
                    {employee.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{employee.designation}</td>
                <td className="px-4 py-3 text-muted-foreground">{employee.department}</td>
                <td className="px-4 py-3">
                  <Badge variant={employee.accountStatus === "ACTIVE" ? "success" : "muted"}>
                    {employee.accountStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {employee.user ? (
                    <Badge variant="accent">Library Admin</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">No login</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/employees/${employee.id}`)} aria-label="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {isOwner && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/employees/${employee.id}/edit`)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(employee.id, employee.accountStatus === "ACTIVE")}
                          aria-label={employee.accountStatus === "ACTIVE" ? "Deactivate" : "Activate"}
                        >
                          {employee.accountStatus === "ACTIVE" ? (
                            <ShieldOff className="h-4 w-4" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget({ id: employee.id, name: employee.name })}
                          aria-label="Delete"
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this employee?"
        description={`${deleteTarget?.name} will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteEmployee.isPending}
      />
    </div>
  );
}
