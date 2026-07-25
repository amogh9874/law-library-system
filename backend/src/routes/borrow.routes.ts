import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as borrowController from "../controllers/borrow.controller";

const router = Router();
router.use(authenticate);

// Every borrow-management action (issue/return/renew/mark lost) is a
// Library Admin (or Website Owner) responsibility per spec — employees
// don't have their own accounts to self-serve this.
const canManage = authorize("LIBRARY_ADMIN", "WEBSITE_OWNER");

router.get("/", canManage, borrowController.listBorrowRecords);
router.post("/issue", canManage, borrowController.issueBook);
router.post("/:id/return", canManage, borrowController.returnBook);
router.post("/:id/renew", canManage, borrowController.renewBook);
router.post("/:id/mark-lost", canManage, borrowController.markBorrowLost);
router.get("/employee/:employeeId", canManage, borrowController.getEmployeeBorrowHistory);

export default router;
