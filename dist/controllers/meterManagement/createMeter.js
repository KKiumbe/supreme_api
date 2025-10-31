"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMeter = void 0;
const globalPrisma_1 = __importDefault(require("@/globalPrisma"));
// ✅ Create Meter
const createMeter = async (req, res, next) => {
    const { tenantId } = req.user;
    try {
        const { serialNumber, model, installationDate, lastInspectedAt, status, meta, meterSize, connectionId, } = req.body;
        // Validate required fields
        if (!serialNumber || !tenantId) {
            res.status(400).json({ message: 'serialNumber and tenantId are required.' });
        }
        const newMeter = await globalPrisma_1.default.meter.create({
            data: {
                serialNumber,
                model,
                installationDate: installationDate ? new Date(installationDate) : null,
                lastInspectedAt: lastInspectedAt ? new Date(lastInspectedAt) : null,
                status: status || 'installed',
                meta: meta ? JSON.parse(meta) : {},
                meterSize,
                tenantId,
                connectionId,
            },
        });
        res.status(201).json({
            message: 'Meter created successfully',
            data: newMeter,
        });
    }
    catch (error) {
        console.error('Error creating meter:', error);
        res.status(500).json({
            message: 'Failed to create meter',
            error: error.message,
        });
    }
};
exports.createMeter = createMeter;
