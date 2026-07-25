import { Router } from "express";
import { prisma } from "../config/prisma";
import { authenticate, authorize } from "../middleware/auth";
import { createCatalogController } from "../controllers/catalog.controller";

// All catalog write operations (create/edit/delete) are available to the
// Library Admin (per spec: "Manage authors/publishers/categories") and to
// the Website Owner, who has access to every module. Both roles can read.

function buildCatalogRouter(
  delegate: Parameters<typeof createCatalogController>[0],
  entityLabel: string,
  moduleName: string
) {
  const router = Router();
  const controller = createCatalogController(delegate, entityLabel, moduleName);

  router.use(authenticate);
  router.get("/", controller.list);
  router.get("/:id", controller.getOne);
  router.post("/", authorize("LIBRARY_ADMIN", "WEBSITE_OWNER"), controller.create);
  router.put("/:id", authorize("LIBRARY_ADMIN", "WEBSITE_OWNER"), controller.update);
  router.delete("/:id", authorize("LIBRARY_ADMIN", "WEBSITE_OWNER"), controller.remove);

  return router;
}

export const authorsRouter = buildCatalogRouter(prisma.author, "Author", "Authors");
export const publishersRouter = buildCatalogRouter(prisma.publisher, "Publisher", "Publishers");
export const categoriesRouter = buildCatalogRouter(prisma.category, "Category", "Categories");
