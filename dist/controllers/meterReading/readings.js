"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMeterReading = exports.updateMeterReading = exports.getMeterReadingById = exports.getMeterAbnormalReadings = exports.getMeterReadings = exports.createMeterReading = void 0;
const globalPrisma_1 = __importDefault(require("../../globalPrisma"));
const library_1 = require("@prisma/client/runtime/library");
/**
 * @desc Create a new meter reading
 * @route POST /api/meter-readings
 */
const createMeterReading = async (req, res, next) => {
    try {
        const { id: userId } = req.user;
        const { meterId, currentReading, notes } = req.body;
        console.log(`Incoming meter reading request: ${JSON.stringify(req.body)}`);
        // 1️⃣ Validate input
        if (!meterId || currentReading === undefined) {
            res.status(400).json({
                success: false,
                message: "Meter ID and current reading are required.",
            });
            return;
        }
        if (isNaN(Number(meterId))) {
            res.status(400).json({
                success: false,
                message: "Invalid meter ID.",
            });
            return;
        }
        // 2️⃣ Ensure meter exists
        const meter = await globalPrisma_1.default.meter.findUnique({
            where: { id: Number(meterId) },
        });
        if (!meter) {
            res.status(404).json({
                success: false,
                message: "Meter not found.",
            });
            return;
        }
        // 3️⃣ Fetch last reading
        const lastReading = await globalPrisma_1.default.meterReading.findFirst({
            where: { meterId: Number(meterId) },
            orderBy: { readingDate: "desc" },
        });
        const previousReading = lastReading?.currentReading || new library_1.Decimal(0);
        // 4️⃣ Compute current consumption
        const consumption = new library_1.Decimal(currentReading).minus(previousReading);
        if (consumption.lt(0)) {
            res.status(400).json({
                success: false,
                message: "Current reading cannot be less than previous reading. Please verify your input.",
            });
            return;
        }
        // 5️⃣ Fetch up to last 3 readings for average computation
        const recentReadings = await globalPrisma_1.default.meterReading.findMany({
            where: { meterId: Number(meterId), consumption: { not: null } },
            orderBy: { readingDate: "desc" },
            take: 3,
            select: { consumption: true },
        });
        let status = "NORMAL";
        let avgConsumption = new library_1.Decimal(0);
        // 🧠 Determine abnormality based on history
        if (recentReadings.length === 0) {
            // No history → automatically abnormal
            status = "ABNORMAL";
        }
        else {
            // Compute average based on available history (1, 2, or 3 readings)
            avgConsumption = recentReadings
                .reduce((sum, r) => sum.plus(r.consumption || new library_1.Decimal(0)), new library_1.Decimal(0))
                .div(recentReadings.length);
            // Mark abnormal if consumption > 2× average
            if (avgConsumption.gt(0) && consumption.gt(avgConsumption.mul(2))) {
                status = "ABNORMAL";
            }
        }
        // 6️⃣ Save new reading
        const reading = await globalPrisma_1.default.meterReading.create({
            data: {
                meterId: Number(meterId),
                previousReading,
                currentReading: new library_1.Decimal(currentReading),
                consumption,
                recordedBy: userId,
                notes: notes || null,
                status,
            },
        });
        // 7️⃣ Send response
        res.status(201).json({
            success: true,
            message: `Meter reading recorded successfully${status === "ABNORMAL" ? " (Marked as ABNORMAL)" : ""}.`,
            data: reading,
        });
    }
    catch (err) {
        console.error("Error creating meter reading:", err);
        next(err);
    }
};
exports.createMeterReading = createMeterReading;
/**
 * @desc Get all meter readings (with optional filters)
 * @route GET /api/meter-readings
 */
const getMeterReadings = async (req, res, next) => {
    try {
        const { meterId, page = 1, limit = 20 } = req.query;
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            res.status(401).json({ success: false, message: "Unauthorized tenant access" });
            return;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const where = meterId
            ? {
                meter: {
                    id: Number(meterId),
                    tenantId,
                },
            }
            : {
                meter: { tenantId },
            };
        const [readings, total] = await Promise.all([
            globalPrisma_1.default.meterReading.findMany({
                where,
                orderBy: { readingDate: "desc" },
                skip,
                take: Number(limit),
                include: {
                    meter: {
                        select: {
                            id: true,
                            serialNumber: true,
                            model: true,
                            tenantId: true,
                            connection: {
                                select: {
                                    id: true,
                                    connectionNumber: true,
                                    status: true,
                                    customer: {
                                        select: {
                                            id: true,
                                            accountNumber: true,
                                            customerName: true,
                                            phoneNumber: true,
                                            email: true,
                                            status: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
            globalPrisma_1.default.meterReading.count({ where }),
        ]);
        res.status(200).json({
            success: true,
            message: "Meter readings retrieved successfully",
            data: readings,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
                hasNext: Number(page) * Number(limit) < total,
                hasPrev: Number(page) > 1,
            },
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getMeterReadings = getMeterReadings;
const getMeterAbnormalReadings = async (req, res, next) => {
    try {
        const { meterId, page = 1, limit = 20, search } = req.query;
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            res
                .status(401)
                .json({ success: false, message: "Unauthorized tenant access" });
            return;
        }
        const skip = (Number(page) - 1) * Number(limit);
        // --------------------------------------------------------------
        // 1. Base tenant filter
        // --------------------------------------------------------------
        const baseWhere = {
            meter: { tenantId },
        };
        // --------------------------------------------------------------
        // 2. OPTIONAL: filter by a single meter
        // --------------------------------------------------------------
        const meterWhere = meterId
            ? { meter: { id: Number(meterId), tenantId } }
            : baseWhere;
        // --------------------------------------------------------------
        // 3. **FORCE** ONLY ABNORMAL READINGS
        // --------------------------------------------------------------
        const where = {
            ...meterWhere,
            status: "ABNORMAL", // <-- THIS IS THE ONLY NEW LINE
            // (optional) free-text search across related fields
            ...(search && {
                OR: [
                    { meter: { serialNumber: { contains: search, mode: "insensitive" } } },
                    { meter: { model: { contains: search, mode: "insensitive" } } },
                    {
                        meter: {
                            connection: {
                                connectionNumber: { contains: search, mode: "insensitive" },
                            },
                        },
                    },
                    {
                        meter: {
                            connection: {
                                customer: {
                                    accountNumber: { contains: search, mode: "insensitive" },
                                },
                            },
                        },
                    },
                    {
                        meter: {
                            connection: {
                                customer: { customerName: { contains: search, mode: "insensitive" } },
                            },
                        },
                    },
                ],
            }),
        };
        // --------------------------------------------------------------
        // 4. Query + count
        // --------------------------------------------------------------
        const [readings, total] = await Promise.all([
            globalPrisma_1.default.meterReading.findMany({
                where,
                orderBy: { readingDate: "desc" },
                skip,
                take: Number(limit),
                include: {
                    meter: {
                        select: {
                            id: true,
                            serialNumber: true,
                            model: true,
                            tenantId: true,
                            connection: {
                                select: {
                                    id: true,
                                    connectionNumber: true,
                                    status: true,
                                    customer: {
                                        select: {
                                            id: true,
                                            accountNumber: true,
                                            customerName: true,
                                            phoneNumber: true,
                                            email: true,
                                            status: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
            globalPrisma_1.default.meterReading.count({ where }),
        ]);
        // --------------------------------------------------------------
        // 5. Response
        // --------------------------------------------------------------
        res.status(200).json({
            success: true,
            message: "Abnormal meter readings retrieved successfully",
            data: readings,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
                hasNext: Number(page) * Number(limit) < total,
                hasPrev: Number(page) > 1,
            },
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getMeterAbnormalReadings = getMeterAbnormalReadings;
/**
 * @desc Get single meter reading by ID
 * @route GET /api/meter-readings/:id
 */
const getMeterReadingById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const reading = await globalPrisma_1.default.meterReading.findUnique({
            where: { id },
            include: {
                meter: {
                    select: {
                        id: true,
                        serialNumber: true,
                        model: true,
                    },
                },
            },
        });
        if (!reading) {
            res.status(404).json({ success: false, message: "Meter reading not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Meter reading retrieved successfully",
            data: reading,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getMeterReadingById = getMeterReadingById;
/**
 * @desc Update a meter reading
 * @route PUT /api/meter-readings/:id
 */
const updateMeterReading = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { previousReading, currentReading, notes } = req.body;
        const updated = await globalPrisma_1.default.meterReading.update({
            where: { id },
            data: {
                previousReading: previousReading ? new library_1.Decimal(previousReading) : undefined,
                currentReading: currentReading ? new library_1.Decimal(currentReading) : undefined,
                notes: notes ?? undefined,
                updatedAt: new Date(),
            },
        });
        res.status(200).json({
            success: true,
            message: "Meter reading updated successfully",
            data: updated,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateMeterReading = updateMeterReading;
/**
 * @desc Delete a meter reading
 * @route DELETE /api/meter-readings/:id
 */
const deleteMeterReading = async (req, res, next) => {
    try {
        const { id } = req.params;
        await globalPrisma_1.default.meterReading.delete({ where: { id } });
        res.status(200).json({
            success: true,
            message: "Meter reading deleted successfully",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteMeterReading = deleteMeterReading;
