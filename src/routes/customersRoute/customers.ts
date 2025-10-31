import express from "express";
import verifyToken from "../../middleware/verifyToken";
import { createCustomer } from "../../controllers/customers/addCustomer";
import { getCustomers, getNewCustomers } from "../../controllers/customers/fetchCustomers";


const router = express.Router();

router.post("/customers", verifyToken, createCustomer);

router.get("/customers", verifyToken, getCustomers);
router.get("/new-customers", verifyToken, getNewCustomers);

export default router;
