import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Employee, PaginatedResponse } from "@/types";

export function useEmployees(search: string, page: number, pageSize = 20) {
  return useQuery({
    queryKey: ["employees", { search, page, pageSize }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Employee>>("/employees", {
        params: { search: search || undefined, page, pageSize },
      });
      return data;
    },
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: ["employees", id],
    queryFn: async () => {
      const { data } = await api.get<Employee>(`/employees/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export interface EmployeeFormValues {
  employeeCode: string;
  name: string;
  designation: string;
  department: string;
  officeLocation: string;
  email: string;
  phoneNumber: string;
  createLoginAccount?: boolean;
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: EmployeeFormValues) => {
      const { data } = await api.post<{ employee: Employee; temporaryPassword?: string }>(
        "/employees",
        values
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<EmployeeFormValues>) => {
      const { data } = await api.put<Employee>(`/employees/${id}`, values);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/employees/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}

function useEmployeeAction(action: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/employees/${id}/${action}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export const useActivateEmployee = () => useEmployeeAction("activate");
export const useDeactivateEmployee = () => useEmployeeAction("deactivate");
export const useResetEmployeePassword = () => useEmployeeAction("reset-password");
export const useGrantAdminAccess = () => useEmployeeAction("grant-admin");
export const useRevokeAdminAccess = () => useEmployeeAction("revoke-admin");
