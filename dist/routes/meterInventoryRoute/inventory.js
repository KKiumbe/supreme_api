"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyToken_1 = __importDefault(require("../../middleware/verifyToken"));
const createMeter_1 = require("../../controllers/meterManagement/createMeter");
const getMeterById_1 = require("../../controllers/metersInventory/getMeterById");
const getMeters_1 = require("../../controllers/metersInventory/getMeters");
const assignMeterToConn_1 = require("../../controllers/meterManagement/assignMeterToConn");
const router = express_1.default.Router();
router.post("/meter", verifyToken_1.default, createMeter_1.createMeter);
router.put("/assign-meter", verifyToken_1.default, assignMeterToConn_1.assignMeterToConnection);
router.get("/meters", verifyToken_1.default, getMeters_1.getMeters);
router.get("/meter/:id", verifyToken_1.default, getMeterById_1.getMeter);
exports.default = router;
