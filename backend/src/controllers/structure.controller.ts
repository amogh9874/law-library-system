import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { createRoomSchema, createShelfSchema } from "../validators/structure.validator";
import { structureService } from "../services/structure.service";
import { logActivity } from "../services/activityLog.service";

export const listFloors = asyncHandler(async (_req: Request, res: Response) => {
  const floors = await structureService.listFloors();
  res.json(floors);
});

export const listRooms = asyncHandler(async (req: Request, res: Response) => {
  const floorId = typeof req.query.floorId === "string" ? req.query.floorId : undefined;
  const rooms = await structureService.listRooms(floorId);
  res.json(rooms);
});

export const createRoom = asyncHandler(async (req: Request, res: Response) => {
  const input = createRoomSchema.parse(req.body);
  const room = await structureService.createRoom(input);
  await logActivity({
    userId: req.user!.userId,
    action: "ROOM_ADDED",
    module: "Rooms",
    details: input.name,
    req,
  });
  res.status(201).json(room);
});

export const updateRoom = asyncHandler(async (req: Request, res: Response) => {
  const input = createRoomSchema.partial().parse(req.body);
  const room = await structureService.updateRoom(req.params.id, input);
  await logActivity({
    userId: req.user!.userId,
    action: "ROOM_EDITED",
    module: "Rooms",
    details: room.name,
    req,
  });
  res.json(room);
});

export const deleteRoom = asyncHandler(async (req: Request, res: Response) => {
  await structureService.deleteRoom(req.params.id);
  await logActivity({
    userId: req.user!.userId,
    action: "ROOM_DELETED",
    module: "Rooms",
    details: req.params.id,
    req,
  });
  res.json({ message: "Room deleted successfully" });
});

export const listShelves = asyncHandler(async (req: Request, res: Response) => {
  const roomId = typeof req.query.roomId === "string" ? req.query.roomId : undefined;
  const shelves = await structureService.listShelves(roomId);
  res.json(shelves);
});

export const createShelf = asyncHandler(async (req: Request, res: Response) => {
  const input = createShelfSchema.parse(req.body);
  const shelf = await structureService.createShelf(input);
  await logActivity({
    userId: req.user!.userId,
    action: "SHELF_ADDED",
    module: "Shelves",
    details: input.name,
    req,
  });
  res.status(201).json(shelf);
});

export const updateShelf = asyncHandler(async (req: Request, res: Response) => {
  const input = createShelfSchema.partial().parse(req.body);
  const shelf = await structureService.updateShelf(req.params.id, input);
  await logActivity({
    userId: req.user!.userId,
    action: "SHELF_EDITED",
    module: "Shelves",
    details: shelf.name,
    req,
  });
  res.json(shelf);
});

export const deleteShelf = asyncHandler(async (req: Request, res: Response) => {
  await structureService.deleteShelf(req.params.id);
  await logActivity({
    userId: req.user!.userId,
    action: "SHELF_DELETED",
    module: "Shelves",
    details: req.params.id,
    req,
  });
  res.json({ message: "Shelf deleted successfully" });
});
