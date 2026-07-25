import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEmployee, useCreateEmployee, useUpdateEmployee } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/context/ToastContext";
import { getErrorMessage } from "@/lib/api";

const employeeFormSchema = z.object({
  employeeCode: z.string().min(1, "Employee code is required"),
  name: z.string().min(1, "Name is required"),
  designation: z.string().min(1, "Designation is required"),
  department: z.string().min(1, "Department is required"),
  officeLocation: z.string().min(1, "Office location is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  createLoginAccount: z.boolean().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export function EmployeeFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: existing, isLoading } = useEmployee(id);
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee(id ?? "");

  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({ resolver: zodResolver(employeeFormSchema) });

  useEffect(() => {
    if (existing) {
      reset({
        employeeCode: existing.employeeCode,
        name: existing.name,
        designation: existing.designation,
        department: existing.department,
        officeLocation: existing.officeLocation,
        email: existing.email,
        phoneNumber: existing.phoneNumber,
      });
    }
  }, [existing, reset]);

  const createLoginAccount = watch("createLoginAccount");

  async function onSubmit(values: EmployeeFormValues) {
    try {
      if (isEdit) {
        await updateEmployee.mutateAsync(values);
        toast("Employee updated successfully", "success");
        navigate(`/employees/${id}`);
      } else {
        const result = await createEmployee.mutateAsync(values);
        toast("Employee added successfully", "success");
        if (result.temporaryPassword) {
          setTemporaryPassword(result.temporaryPassword);
        } else {
          navigate(`/employees/${result.employee.id}`);
        }
      }
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  }

  if (isEdit && isLoading) {
    return <p className="text-sm text-muted-foreground">Loading employee...</p>;
  }

  if (temporaryPassword) {
    return (
      <div className="max-w-md space-y-4 rounded-lg border border-border bg-card p-6">
        <h1 className="font-display text-xl font-semibold text-foreground">Employee Added</h1>
        <p className="text-sm text-muted-foreground">
          A Library Admin login was created. Share this temporary password with them securely — it
          will not be shown again.
        </p>
        <div className="rounded-md border border-accent/30 bg-accent/10 px-4 py-3 font-mono text-sm text-accent">
          {temporaryPassword}
        </div>
        <Button onClick={() => navigate("/employees")}>Done</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link to="/employees" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-foreground">
          {isEdit ? "Edit Employee" : "Add Employee"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-border bg-card p-6">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Employee Code" error={errors.employeeCode?.message}>
            <Input {...register("employeeCode")} placeholder="EMP-0006" />
          </Field>
          <Field label="Full Name" error={errors.name?.message}>
            <Input {...register("name")} />
          </Field>
          <Field label="Designation" error={errors.designation?.message}>
            <Input {...register("designation")} />
          </Field>
          <Field label="Department" error={errors.department?.message}>
            <Input {...register("department")} />
          </Field>
          <Field label="Office Location" error={errors.officeLocation?.message}>
            <Input {...register("officeLocation")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </Field>
          <Field label="Phone Number" error={errors.phoneNumber?.message}>
            <Input {...register("phoneNumber")} />
          </Field>
        </div>

        {!isEdit && (
          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3">
            <Checkbox
              id="createLoginAccount"
              checked={!!createLoginAccount}
              onCheckedChange={(checked) => setValue("createLoginAccount", checked === true)}
            />
            <div>
              <Label htmlFor="createLoginAccount">Grant Library Admin login access</Label>
              <p className="text-xs text-muted-foreground">
                Creates a login account for this employee with Library Admin permissions. A
                temporary password will be generated for you to share with them.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Add Employee"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
