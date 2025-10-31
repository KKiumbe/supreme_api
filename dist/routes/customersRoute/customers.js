"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyToken_1 = __importDefault(require("../../middleware/verifyToken"));
const addCustomer_1 = require("../../controllers/customers/addCustomer");
const fetchCustomers_1 = require("../../controllers/customers/fetchCustomers");
const router = express_1.default.Router();
router.post("/customers", verifyToken_1.default, addCustomer_1.createCustomer);
router.get("/customers", verifyToken_1.default, fetchCustomers_1.getCustomers);
router.get("/new-customers", verifyToken_1.default, fetchCustomers_1.getNewCustomers);
exports.default = router;
