"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyToken_1 = __importDefault(require("../../middleware/verifyToken"));
const connections_1 = require("../../controllers/connections/connections");
const assignConnectionToCustomer_1 = require("../../controllers/connections/assignConnectionToCustomer");
const router = express_1.default.Router();
// All routes protected by auth middleware
router.use(verifyToken_1.default);
router.get("/get-connections", connections_1.getConnections); // Get all connections for tenant
router.get("/get-available-connections", connections_1.getConnections);
router.get("/connection/:id", connections_1.getConnectionById); // Get single connection
router.post("/create-connection", connections_1.createConnection); // Create connection
router.put("/update-connection/:id", connections_1.updateConnection); // Update connection
router.post("/assign-connection", verifyToken_1.default, assignConnectionToCustomer_1.assignConnection);
router.delete("/delete-connection/:id", connections_1.deleteConnection); // Delete connection
exports.default = router;
