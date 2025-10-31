import express from "express";
import verifyToken from "../../middleware/verifyToken";
import { generateBillsForActiveConnections } from "../../controllers/billing/billing";
import { getBills } from "../../controllers/billing/getAllBills";

const router = express.Router();

router.post("/generate-bills", verifyToken, generateBillsForActiveConnections);

router.get("/get-bills", verifyToken, getBills);

export default router;
