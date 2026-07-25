import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { CreateRoomInput, CreateShelfInput } from "../validators/structure.validator";

export const structureService = {
  async listFloors() {
    return prisma.floor.findMany({ orderBy: { name: "asc" } });
  },

  async listRooms(floorId?: string) {
    return prisma.room.findMany({
      where: floorId ? { floorId } : {},
      include: { floor: true, _count: { select: { shelves: true } } },
      orderBy: { name: "asc" },
    });
  },

  async createRoom(input: CreateRoomInput) {
    const floor = await prisma.floor.findUnique({ where: { id: input.floorId } });
    if (!floor) {
      throw new AppError("Floor not found", 404);
    }
    return prisma.room.create({ data: { name: input.name, floorId: input.floorId } });
  },

  async updateRoom(id: string, input: Partial<CreateRoomInput>) {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) throw new AppError("Room not found", 404);
    return prisma.room.update({
      where: { id },
      data: { name: input.name ?? room.name, floorId: input.floorId ?? room.floorId },
    });
  },

  async deleteRoom(id: string) {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) throw new AppError("Room not found", 404);
    const shelfCount = await prisma.shelf.count({ where: { roomId: id } });
    if (shelfCount > 0) {
      throw new AppError("Cannot delete a room that still has shelves assigned to it", 409);
    }
    await prisma.room.delete({ where: { id } });
  },

  async listShelves(roomId?: string) {
    return prisma.shelf.findMany({
      where: roomId ? { roomId } : {},
      include: { room: { include: { floor: true } } },
      orderBy: { name: "asc" },
    });
  },

  async createShelf(input: CreateShelfInput) {
    const room = await prisma.room.findUnique({ where: { id: input.roomId } });
    if (!room) {
      throw new AppError("Room not found", 404);
    }
    return prisma.shelf.create({ data: { name: input.name, roomId: input.roomId } });
  },

  async updateShelf(id: string, input: Partial<CreateShelfInput>) {
    const shelf = await prisma.shelf.findUnique({ where: { id } });
    if (!shelf) throw new AppError("Shelf not found", 404);
    return prisma.shelf.update({
      where: { id },
      data: { name: input.name ?? shelf.name, roomId: input.roomId ?? shelf.roomId },
    });
  },

  async deleteShelf(id: string) {
    const shelf = await prisma.shelf.findUnique({ where: { id } });
    if (!shelf) throw new AppError("Shelf not found", 404);
    const locationCount = await prisma.bookLocation.count({ where: { shelfId: id } });
    if (locationCount > 0) {
      throw new AppError("Cannot delete a shelf that still has books assigned to it", 409);
    }
    await prisma.shelf.delete({ where: { id } });
  },
};
