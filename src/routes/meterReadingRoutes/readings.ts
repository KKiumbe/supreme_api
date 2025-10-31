import express from "express";
import verifyToken from "../../middleware/verifyToken";
import { createMeterReading,getMeterReadings ,getMeterReadingById, updateMeterReading, deleteMeterReading, getMeterAbnormalReadings} from "../../controllers/meterReading/readings";


const router = express.Router();

router.post("/create-meter-reading", verifyToken, createMeterReading);
router.get("/get-meter-readings", verifyToken, getMeterReadings);

router.get("/get-abnormal-readings", verifyToken, getMeterAbnormalReadings);
router.get("/get-meter-reading/:id", verifyToken, getMeterReadingById);
router.put("/update-meter-reading/:id", verifyToken, updateMeterReading);
router.delete("/delete-meter-reading/:id", verifyToken, deleteMeterReading);

export default router;
