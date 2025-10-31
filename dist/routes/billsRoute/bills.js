"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyToken_1 = __importDefault(require("../../middleware/verifyToken"));
const billing_1 = require("../../controllers/billing/billing");
const getAllBills_1 = require("../../controllers/billing/getAllBills");
const router = express_1.default.Router();
router.post("/generate-bills", verifyToken_1.default, billing_1.generateBillsForActiveConnections);
router.get("/get-bills", verifyToken_1.default, getAllBills_1.getBills);
exports.default = router;
