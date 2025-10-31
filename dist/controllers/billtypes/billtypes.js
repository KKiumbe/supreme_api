"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBillTypes = exports.createBillType = void 0;
const globalPrisma_1 = __importDefault(require("../../globalPrisma"));
const createBillType = async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId;
        const { name } = req.body;
        // 1. Auth check
        if (!tenantId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        // 2. Validate input
        if (!name || typeof name !== "string" || name.trim().length < 2) {
            res.status(400).json({
                success: false,
                message: "Bill type name is required and must be at least 2 characters.",
            });
            return;
        }
        const trimmedName = name.trim();
        // 3. Check for duplicate (per tenant)
        const existing = await globalPrisma_1.default.billType.findFirst({
            where: {
                tenantId,
                name: {
                    equals: trimmedName,
                    mode: "insensitive", // case-insensitive
                },
            },
        });
        if (existing) {
            res.status(409).json({
                success: false,
                message: `Bill type "${trimmedName}" already exists.`,
            });
            return;
        }
        // 4. Create bill type
        const billType = await globalPrisma_1.default.billType.create({
            data: {
                tenantId,
                name: trimmedName,
            },
            select: {
                id: true,
                name: true,
                tenantId: true,
            },
        });
        res.status(201).json({
            success: true,
            message: "Bill type created successfully.",
            data: billType,
        });
    }
    catch (error) {
        console.error("Error creating bill type:", {
            tenantId: req.user?.tenantId,
            body: req.body,
            error: error.message,
        });
        // Handle Prisma unique constraint violation
        if (error.code === "P2002") {
            res.status(409).json({
                success: false,
                message: "A bill type with this name already exists.",
            });
            return;
        }
        next(error);
    }
};
exports.createBillType = createBillType;
const getBillTypes = async (req, res) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId)
        return res.status(401).json({ success: false, message: "Unauthorized" });
    const types = await globalPrisma_1.default.billType.findMany({
        where: { tenantId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
    });
    res.json({ success: true, data: types });
};
exports.getBillTypes = getBillTypes;
