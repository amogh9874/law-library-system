import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { NamedEntity, PaginatedResponse } from "@/types";

export function useCatalogPage(endpoint: string, search: string, page: number, pageSize = 20) {
  return useQuery({
    queryKey: [endpoint, { search, page, pageSize }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<NamedEntity>>(`/${endpoint}`, {
        params: { search: search || undefined, page, pageSize },
      });
      return data;
    },
  });
}

export function useCreateCatalogEntry(endpoint: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post<NamedEntity>(`/${endpoint}`, { name });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [endpoint] }),
  });
}

export function useUpdateCatalogEntry(endpoint: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data } = await api.put<NamedEntity>(`/${endpoint}/${id}`, { name });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [endpoint] }),
  });
}

export function useDeleteCatalogEntry(endpoint: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/${endpoint}/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [endpoint] }),
  });
}
