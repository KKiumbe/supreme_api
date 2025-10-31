import express from "express";
import verifyToken from "../../middleware/verifyToken";
import { deleteConnection, getConnectionById, getConnections, updateConnection,createConnection } from "../../controllers/connections/connections";
import { assignConnection } from "../../controllers/connections/assignConnectionToCustomer";




const router = express.Router();

// All routes protected by auth middleware
router.use(verifyToken);

router.get("/get-connections", getConnections);            // Get all connections for tenant
router.get("/get-available-connections", getConnections);
router.get("/connection/:id", getConnectionById);     // Get single connection
router.post("/create-connection", createConnection);        // Create connection
router.put("/update-connection/:id", updateConnection);      // Update connection
router.post("/assign-connection", verifyToken, assignConnection);
router.delete("/delete-connection/:id", deleteConnection);   // Delete connection

export default router;
