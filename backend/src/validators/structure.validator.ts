import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().trim().min(1, "Room name is required").max(100),
  floorId: z.string().uuid("Invalid floor ID"),
});

export const createShelfSchema = z.object({
  name: z.string().trim().min(1, "Shelf name is required").max(100),
  roomId: z.string().uuid("Invalid room ID"),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type CreateShelfInput = z.infer<typeof createShelfSchema>;
