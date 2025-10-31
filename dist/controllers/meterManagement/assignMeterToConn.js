"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignMeterToConnection = void 0;
const globalPrisma_1 = __importDefault(require("@/globalPrisma"));
// Assign a meter to a connection
const assignMeterToConnection = async (req, res, next) => {
    const { connectionId, meterId } = req.body;
    const tenantId = req.user?.tenantId;
    if (!connectionId || !meterId) {
        res.status(400).json({ message: "connectionId and meterId are required" });
        return;
    }
    try {
        // Check if meter belongs to tenant
        const meter = await globalPrisma_1.default.meter.findFirst({
            where: { id: meterId, tenantId },
        });
        if (!meter) {
            res.status(404).json({ message: "Meter not found" });
            return;
        }
        // Check if connection belongs to tenant
        const connection = await globalPrisma_1.default.connection.findFirst({
            where: { id: connectionId, tenantId },
        });
        if (!connection) {
            res.status(404).json({ message: "Connection not found" });
            return;
        }
        // Assign meter to connection
        const updatedMeter = await globalPrisma_1.default.meter.update({
            where: { id: meterId },
            data: { connectionId: connectionId },
        });
        res.status(200).json({
            message: "Meter assigned to connection successfully",
            data: updatedMeter,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.assignMeterToConnection = assignMeterToConnection;
