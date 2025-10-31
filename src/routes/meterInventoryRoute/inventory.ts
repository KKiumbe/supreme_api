import express from "express";
import verifyToken from "../../middleware/verifyToken";
import { createCustomer } from "../../controllers/customers/addCustomer";
import { getCustomers } from "../../controllers/customers/fetchCustomers";
import { createMeter } from "../../controllers/meterManagement/createMeter";
import { getMeter } from "../../controllers/metersInventory/getMeterById";
import { getMeters } from "../../controllers/metersInventory/getMeters";
import { assignMeterToConnection } from "../../controllers/meterManagement/assignMeterToConn";


const router = express.Router();

router.post("/meter", verifyToken, createMeter);

router.put("/assign-meter", verifyToken, assignMeterToConnection);


router.get("/meters", verifyToken, getMeters);

router.get("/meter/:id", verifyToken, getMeter);


export default router;
