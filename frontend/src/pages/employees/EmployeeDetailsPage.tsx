import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, KeyRound, ShieldCheck, ShieldOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEmployee, useResetEmployeePassword, useGrantAdminAccess, useRevokeAdminAccess } from "@/hooks/useEmployees";
import { useEmployeeBorrowHistory } from "@/hooks/useBorrowRecords";
import { Button } from "@/components/ui/button";
import { Badge, BorrowStatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import { getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/date";

type PendingAction = "reset-password" | "grant-admin" | "revoke-admin" | null;

export function EmployeeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const { toast } = useToast();

  const { data: employee, isLoading } = useEmployee(id);
  const { data: borrowHistory } = useEmployeeBorrowHistory(id);

  const resetPassword = useResetEmployeePassword();
  const grantAdmin = useGrantAdminAccess();
  const revokeAdmin = useRevokeAdminAccess();

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);

  async function handleConfirm() {
    if (!id || !pendingAction) return;
    try {
      if (pendingAction === "reset-password") {
        const result = await resetPassword.mutateAsync(id);
        setRevealedPassword((result as { newPassword: string }).newPassword);
      } else if (pendingAction === "grant-admin") {
        const result = await grantAdmin.mutateAsync(id);
        setRevealedPassword((result as { temporaryPassword: string }).temporaryPassword);
      } else if (pendingAction === "revoke-admin") {
        await revokeAdmin.mutateAsync(id);
        toast("Library Admin access revoked", "success");
      }
      setPendingAction(null);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading employee...</p>;
  if (!employee) return <p className="text-sm text-muted-foreground">Employee not found.</p>;

  const isPending = resetPassword.isPending || grantAdmin.isPending || revokeAdmin.isPending;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/employees" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </Link>
        {isOwner && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/employees/${id}/edit`)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            {employee.user && (
              <>
                <Button variant="outline" onClick={() => setPendingAction("reset-password")}>
                  <KeyRound className="h-4 w-4" />
                  Reset Password
                </Button>
                <Button variant="outline" onClick={() => setPendingAction("revoke-admin")}>
                  <ShieldOff className="h-4 w-4" />
                  Revoke Admin
                </Button>
              </>
            )}
            {!employee.user && (
              <Button variant="outline" onClick={() => setPendingAction("grant-admin")}>
                <ShieldCheck className="h-4 w-4" />
                Grant Admin Access
              </Button>
            )}
          </div>
        )}
      </div>

      {revealedPassword && (
        <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
          <p className="text-sm text-accent">
            New password generated — share this securely, it will not be shown again:
          </p>
          <p className="mt-2 font-mono text-sm text-accent">{revealedPassword}</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setRevealedPassword(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">{employee.name}</h1>
            <p className="text-sm text-muted-foreground">
              {employee.designation} · {employee.department}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant={employee.accountStatus === "ACTIVE" ? "success" : "muted"}>
              {employee.accountStatus}
            </Badge>
            {employee.user && <Badge variant="accent">Library Admin</Badge>}
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <DetailItem label="Employee Code" value={employee.employeeCode} mono />
          <DetailItem label="Email" value={employee.email} />
          <DetailItem label="Phone Number" value={employee.phoneNumber} />
          <DetailItem label="Office Location" value={employee.officeLocation} />
        </dl>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-card-foreground">Borrowing History</h2>
        </div>
        {!borrowHistory?.length ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">No books borrowed yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-2 font-medium">Book</th>
                <th className="px-5 py-2 font-medium">Issue Date</th>
                <th className="px-5 py-2 font-medium">Due Date</th>
                <th className="px-5 py-2 font-medium">Return Date</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {borrowHistory.map((record) => (
                <tr key={record.id}>
                  <td className="px-5 py-3">
                    <Link to={`/books/${record.book.id}`} className="hover:text-accent">
                      {record.book.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(record.issueDate)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(record.dueDate)}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {record.returnDate ? formatDate(record.returnDate) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <BorrowStatusBadge status={record.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={
          pendingAction === "reset-password"
            ? "Reset this employee's password?"
            : pendingAction === "grant-admin"
              ? "Grant Library Admin access?"
              : "Revoke Library Admin access?"
        }
        description={
          pendingAction === "reset-password"
            ? "A new temporary password will be generated. Their current password stops working immediately."
            : pendingAction === "grant-admin"
              ? "This creates a login account with Library Admin permissions and a temporary password."
              : "This employee will lose their login access and Library Admin permissions immediately."
        }
        confirmLabel="Confirm"
        variant={pendingAction === "revoke-admin" ? "destructive" : "default"}
        onConfirm={handleConfirm}
        isConfirming={isPending}
      />
    </div>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`text-foreground ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
