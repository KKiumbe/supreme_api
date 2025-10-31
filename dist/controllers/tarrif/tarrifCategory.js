"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTariffCategories = exports.createTariffCategory = void 0;
const globalPrisma_1 = __importDefault(require("../../globalPrisma"));
const createTariffCategory = async (req, res, next) => {
    try {
        const { name } = req.body;
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            res.status(401).json({ message: "Unauthorized - Missing tenant context" });
            return;
        }
        if (!name) {
            res.status(400).json({ message: "Tariff name is required" });
            return;
        }
        const existing = await globalPrisma_1.default.tariffCategory.findFirst({
            where: { name },
        });
        if (existing) {
            res.status(400).json({ message: "Tariff category already exists" });
            return;
        }
        const tariffCategory = await globalPrisma_1.default.tariffCategory.create({
            data: {
                name,
                tenantId
            },
        });
        res.status(201).json({
            message: "Tariff category created successfully",
            data: tariffCategory,
        });
    }
    catch (error) {
        console.error("Error creating tariff category:", error);
        next(error);
    }
};
exports.createTariffCategory = createTariffCategory;
// ✅ Fetch all tariff categories (with their blocks)
const getAllTariffCategories = async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            res.status(401).json({ message: "Unauthorized - Missing tenant context" });
            return;
        }
        const categories = await globalPrisma_1.default.tariffCategory.findMany({
            where: { tenantId },
            include: {
                blocks: {
                    orderBy: { minVolume: "asc" }, // optional, to list in logical order
                },
            },
            orderBy: { createdAt: "asc" },
        });
        res.status(200).json({
            message: "Tariff categories fetched successfully",
            count: categories.length,
            data: categories,
        });
    }
    catch (error) {
        console.error("Error fetching tariff categories:", error);
        next(error);
    }
};
exports.getAllTariffCategories = getAllTariffCategories;
