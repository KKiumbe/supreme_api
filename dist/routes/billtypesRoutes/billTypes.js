"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/billType.routes.ts
const express_1 = require("express");
const verifyToken_1 = __importDefault(require("../../middleware/verifyToken"));
const billtypes_1 = require("../../controllers/billtypes/billtypes");
const router = (0, express_1.Router)();
router.post("/create-bill-type", verifyToken_1.default, billtypes_1.createBillType);
router.get("/get-bill-types", verifyToken_1.default, billtypes_1.getBillTypes);
exports.default = router;
