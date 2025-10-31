"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTariffBlocks = exports.createTariffBlock = void 0;
const globalPrisma_1 = __importDefault(require("../../globalPrisma"));
const createTariffBlock = async (req, res, next) => {
    try {
        const { categoryId, minVolume, maxVolume, ratePerUnit } = req.body;
        if (!categoryId || minVolume == null || ratePerUnit == null) {
            res.status(400).json({
                message: "categoryId, minVolume, and ratePerUnit are required",
            });
            return;
        }
        // ✅ Ensure tariff category exists for this tenant
        const tenantId = req.user?.tenantId;
        const category = await globalPrisma_1.default.tariffCategory.findFirst({
            where: { id: categoryId, tenantId },
        });
        if (!category) {
            res.status(404).json({ message: "Tariff category not found" });
            return;
        }
        const tariffBlock = await globalPrisma_1.default.tariffBlock.create({
            data: {
                categoryId,
                minVolume: parseFloat(minVolume),
                maxVolume: maxVolume ? parseFloat(maxVolume) : null,
                ratePerUnit: parseFloat(ratePerUnit),
            },
        });
        res.status(201).json({
            message: "Tariff block added successfully",
            data: tariffBlock,
        });
    }
    catch (error) {
        console.error("Error creating tariff block:", error);
        next(error);
    }
};
exports.createTariffBlock = createTariffBlock;
const getAllTariffBlocks = async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId;
        const blocks = await globalPrisma_1.default.tariffBlock.findMany({
            where: {
                category: {
                    tenantId,
                },
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                minVolume: 'asc',
            },
        });
        res.status(200).json({
            message: 'Tariff blocks fetched successfully',
            data: blocks,
        });
    }
    catch (error) {
        console.error('Error fetching tariff blocks:', error);
        next(error);
    }
};
exports.getAllTariffBlocks = getAllTariffBlocks;
