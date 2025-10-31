"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyToken_1 = __importDefault(require("../../middleware/verifyToken"));
const readings_1 = require("../../controllers/meterReading/readings");
const router = express_1.default.Router();
router.post("/create-meter-reading", verifyToken_1.default, readings_1.createMeterReading);
router.get("/get-meter-readings", verifyToken_1.default, readings_1.getMeterReadings);
router.get("/get-abnormal-readings", verifyToken_1.default, readings_1.getMeterAbnormalReadings);
router.get("/get-meter-reading/:id", verifyToken_1.default, readings_1.getMeterReadingById);
router.put("/update-meter-reading/:id", verifyToken_1.default, readings_1.updateMeterReading);
router.delete("/delete-meter-reading/:id", verifyToken_1.default, readings_1.deleteMeterReading);
exports.default = router;
