import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Book, PaginatedResponse } from "@/types";

export interface BookSearchParams {
  search?: string;
  bookType?: string;
  status?: string;
  categoryId?: string;
  authorId?: string;
  publisherId?: string;
  roomId?: string;
  shelfId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useBooks(params: BookSearchParams) {
  return useQuery({
    queryKey: ["books", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Book>>("/books", { params });
      return data;
    },
  });
}

export function useBook(id: string | undefined) {
  return useQuery({
    queryKey: ["books", id],
    queryFn: async () => {
      const { data } = await api.get<Book>(`/books/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export interface BookFormValues {
  accessionNumber: string;
  isbn?: string;
  barcodeNumber?: string;
  title: string;
  subtitle?: string;
  authorId: string;
  publisherId: string;
  publicationYear?: number;
  edition?: string;
  volume?: string;
  categoryId: string;
  subject?: string;
  language?: string;
  description?: string;
  keywords?: string;
  bookType: string;
  numberOfPages?: number;
  coverImageUrl?: string;
  condition?: string;
  shelfId?: string;
  row?: string;
  position?: string;
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: BookFormValues) => {
      const { data } = await api.post<Book>("/books", values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

export function useUpdateBook(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<BookFormValues>) => {
      const { data } = await api.put<Book>(`/books/${id}`, values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/books/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

export interface BulkDeleteResult {
  successCount: number;
  succeeded: { id: string; title: string }[];
  failed: { id: string; error: string }[];
}

export function useBulkDeleteBooks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { data } = await api.post<BulkDeleteResult>("/books/bulk-delete", { ids });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

export function useMarkBookLost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Book>(`/books/${id}/mark-lost`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["books"] }),
  });
}

export function useMarkBookDamaged() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Book>(`/books/${id}/mark-damaged`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["books"] }),
  });
}
