import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as structureController from "../controllers/structure.controller";

export const floorsRouter = Router();
floorsRouter.use(authenticate);
floorsRouter.get("/", structureController.listFloors);

export const roomsRouter = Router();
roomsRouter.use(authenticate);
roomsRouter.get("/", structureController.listRooms);
roomsRouter.post("/", authorize("LIBRARY_ADMIN", "WEBSITE_OWNER"), structureController.createRoom);
roomsRouter.put("/:id", authorize("LIBRARY_ADMIN", "WEBSITE_OWNER"), structureController.updateRoom);
roomsRouter.delete("/:id", authorize("LIBRARY_ADMIN", "WEBSITE_OWNER"), structureController.deleteRoom);

export const shelvesRouter = Router();
shelvesRouter.use(authenticate);
shelvesRouter.get("/", structureController.listShelves);
shelvesRouter.post("/", authorize("LIBRARY_ADMIN", "WEBSITE_OWNER"), structureController.createShelf);
shelvesRouter.put("/:id", authorize("LIBRARY_ADMIN", "WEBSITE_OWNER"), structureController.updateShelf);
shelvesRouter.delete("/:id", authorize("LIBRARY_ADMIN", "WEBSITE_OWNER"), structureController.deleteShelf);
