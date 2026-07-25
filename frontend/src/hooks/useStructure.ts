import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Floor, Room, Shelf } from "@/types";

export function useFloors() {
  return useQuery({
    queryKey: ["floors"],
    queryFn: async () => {
      const { data } = await api.get<Floor[]>("/floors");
      return data;
    },
    staleTime: 60_000,
  });
}

export function useRooms(floorId?: string) {
  return useQuery({
    queryKey: ["rooms", floorId ?? "all"],
    queryFn: async () => {
      const { data } = await api.get<Room[]>("/rooms", { params: floorId ? { floorId } : {} });
      return data;
    },
    staleTime: 60_000,
  });
}

export function useShelves(roomId?: string) {
  return useQuery({
    queryKey: ["shelves", roomId ?? "all"],
    queryFn: async () => {
      const { data } = await api.get<Shelf[]>("/shelves", { params: roomId ? { roomId } : {} });
      return data;
    },
    enabled: !!roomId,
    staleTime: 60_000,
  });
}

// Shelves across ALL rooms (used on the Shelves management page's table,
// as opposed to the cascading picker in the Book form which needs it
// scoped to one room at a time).
export function useAllShelves() {
  return useQuery({
    queryKey: ["shelves", "all-with-room"],
    queryFn: async () => {
      const { data } = await api.get<Shelf[]>("/shelves");
      return data;
    },
    staleTime: 60_000,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: { name: string; floorId: string }) => {
      const { data } = await api.post<Room>("/rooms", values);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data } = await api.put<Room>(`/rooms/${id}`, { name });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/rooms/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });
}

export function useCreateShelf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: { name: string; roomId: string }) => {
      const { data } = await api.post<Shelf>("/shelves", values);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shelves"] }),
  });
}

export function useUpdateShelf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data } = await api.put<Shelf>(`/shelves/${id}`, { name });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shelves"] }),
  });
}

export function useDeleteShelf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/shelves/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shelves"] }),
  });
}
