"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMeter = void 0;
const globalPrisma_1 = __importDefault(require("../../globalPrisma"));
const createMeter = async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: Tenant not found",
            });
            return;
        }
        // Extract and type-cast input
        const input = req.body;
        // Required field validation
        if (!input.serialNumber || input.serialNumber.trim() === "") {
            res.status(400).json({
                success: false,
                message: "serialNumber is required",
            });
            return;
        }
        const serialNumber = input.serialNumber.trim();
        // Check if serialNumber already exists for this tenant
        const existingMeter = await globalPrisma_1.default.meter.findFirst({
            where: {
                tenantId,
                serialNumber,
            },
        });
        if (existingMeter) {
            res.status(409).json({
                success: false,
                message: "Meter with this serial number already exists in your tenant",
            });
            return;
        }
        // Optional: Validate connectionId if provided
        let connectionId = null;
        if (input.connectionId !== undefined) {
            if (input.connectionId <= 0) {
                res.status(400).json({
                    success: false,
                    message: "connectionId must be a positive integer",
                });
                return;
            }
            const connection = await globalPrisma_1.default.connection.findFirst({
                where: {
                    id: input.connectionId,
                    tenantId,
                },
            });
            if (!connection) {
                res.status(404).json({
                    success: false,
                    message: "Connection not found or does not belong to your tenant",
                });
                return;
            }
            // Ensure no other meter is attached to this connection
            const meterOnConnection = await globalPrisma_1.default.meter.findUnique({
                where: { connectionId: input.connectionId },
            });
            if (meterOnConnection) {
                res.status(409).json({
                    success: false,
                    message: "This connection already has a meter assigned",
                });
                return;
            }
            connectionId = input.connectionId;
        }
        // Parse dates safely
        const parseDate = (dateStr) => {
            if (!dateStr)
                return undefined;
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? undefined : date;
        };
        const installationDate = parseDate(input.installationDate);
        const lastInspectedAt = parseDate(input.lastInspectedAt);
        // Validate meterSize if provided
        const meterSize = input.meterSize !== undefined
            ? (input.meterSize > 0 ? input.meterSize : null)
            : undefined;
        // Create meter
        const meter = await globalPrisma_1.default.meter.create({
            data: {
                serialNumber,
                model: input.model?.trim() || null,
                installationDate,
                lastInspectedAt,
                status: input.status || "installed",
                meterSize,
                tenantId,
                connectionId,
                meta: input.meta || {},
            },
            include: {
                connection: {
                    include: {
                        customer: {
                            select: {
                                id: true,
                                customerName: true,
                                accountNumber: true,
                            },
                        },
                    },
                },
            },
        });
        res.status(201).json({
            success: true,
            message: "Meter created successfully",
            data: meter,
        });
    }
    catch (error) {
        console.error("Error creating meter:", error);
        // Handle Prisma unique constraint or DB errors
        if (error.code === "P2002") {
            res.status(409).json({
                success: false,
                message: "A meter with this serial number already exists",
            });
            return;
        }
        // Pass other errors to error handler middleware
        next(error);
    }
};
exports.createMeter = createMeter;
