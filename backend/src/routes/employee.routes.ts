import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as employeeController from "../controllers/employee.controller";

const router = Router();
router.use(authenticate);

// Per spec: both roles can view employee info, but only the Website Owner
// can add/edit/delete/activate/deactivate/reset passwords/assign roles.
const ownerOnly = authorize("WEBSITE_OWNER");

router.get("/", employeeController.listEmployees);
router.get("/:id", employeeController.getEmployee);

router.post("/", ownerOnly, employeeController.createEmployee);
router.put("/:id", ownerOnly, employeeController.updateEmployee);
router.delete("/:id", ownerOnly, employeeController.deleteEmployee);
router.post("/:id/activate", ownerOnly, employeeController.activateEmployee);
router.post("/:id/deactivate", ownerOnly, employeeController.deactivateEmployee);
router.post("/:id/reset-password", ownerOnly, employeeController.resetEmployeePassword);
router.post("/:id/grant-admin", ownerOnly, employeeController.grantAdminAccess);
router.post("/:id/revoke-admin", ownerOnly, employeeController.revokeAdminAccess);

export default router;
