import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BorrowRecord, PaginatedResponse } from "@/types";

export interface BorrowSearchParams {
  employeeId?: string;
  status?: string;
  bookId?: string;
  page?: number;
  pageSize?: number;
}

export function useBorrowRecords(params: BorrowSearchParams) {
  return useQuery({
    queryKey: ["borrow-records", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<BorrowRecord>>("/borrow-records", { params });
      return data;
    },
  });
}

export function useEmployeeBorrowHistory(employeeId: string | undefined) {
  return useQuery({
    queryKey: ["borrow-records", "employee", employeeId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<BorrowRecord>>(
        `/borrow-records/employee/${employeeId}`,
        { params: { pageSize: 50 } }
      );
      return data.data;
    },
    enabled: !!employeeId,
  });
}

export function useIssueBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: { bookId: string; employeeId: string; dueDate: string; remarks?: string }) => {
      const { data } = await api.post<BorrowRecord>("/borrow-records/issue", values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrow-records"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

export function useReturnBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<BorrowRecord>(`/borrow-records/${id}/return`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrow-records"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

export function useRenewBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newDueDate }: { id: string; newDueDate: string }) => {
      const { data } = await api.post<BorrowRecord>(`/borrow-records/${id}/renew`, { newDueDate });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["borrow-records"] }),
  });
}

export function useMarkBorrowLost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<BorrowRecord>(`/borrow-records/${id}/mark-lost`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrow-records"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}
