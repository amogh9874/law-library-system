import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { NamedEntity, PaginatedResponse } from "@/types";

function useCatalogList(endpoint: string) {
  return useQuery({
    queryKey: [endpoint, "all"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<NamedEntity>>(`/${endpoint}`, {
        params: { pageSize: 100 },
      });
      return data.data;
    },
    staleTime: 60_000,
  });
}

export const useAuthors = () => useCatalogList("authors");
export const usePublishers = () => useCatalogList("publishers");
export const useCategories = () => useCatalogList("categories");
