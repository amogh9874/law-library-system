import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as bookController from "../controllers/book.controller";
import { importBooks, downloadImportTemplate } from "../controllers/bookImport.controller";

const router = Router();
router.use(authenticate);

const canWrite = authorize("LIBRARY_ADMIN", "WEBSITE_OWNER");

// Specific paths before /:id so they aren't swallowed by the param route.
router.get("/deleted", canWrite, bookController.listDeletedBooks);
router.get("/import/template", canWrite, downloadImportTemplate);
router.post("/import", canWrite, importBooks);
router.post("/bulk-delete", canWrite, bookController.bulkDeleteBooks);

router.get("/", bookController.searchBooks);
router.get("/:id", bookController.getBook);
router.post("/", canWrite, bookController.createBook);
router.put("/:id", canWrite, bookController.updateBook);
router.delete("/:id", canWrite, bookController.deleteBook);
router.post("/:id/restore", canWrite, bookController.restoreBook);
router.post("/:id/mark-lost", canWrite, bookController.markBookLost);
router.post("/:id/mark-damaged", canWrite, bookController.markBookDamaged);

export default router;
