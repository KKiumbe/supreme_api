// src/routes/billType.routes.ts
import { Router } from "express";
import verifyToken from "../../middleware/verifyToken";
import { createBillType, getBillTypes } from "../../controllers/billtypes/billtypes";

const router = Router();

router.post("/create-bill-type", verifyToken, createBillType);
router.get("/get-bill-types", verifyToken, getBillTypes);

export default router;