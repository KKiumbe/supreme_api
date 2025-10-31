"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConnection = exports.updateConnection = exports.createConnection = exports.getConnectionById = exports.getAvailableConnections = exports.getConnections = void 0;
const globalPrisma_1 = __importDefault(require("../../globalPrisma"));
const getConnections = async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId)
            throw new Error("Tenant not found in request");
        // Parse and validate query with defaults
        const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc', } = req.query;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;
        // Build dynamic WHERE clause
        const where = {
            tenantId,
            ...(search
                ? {
                    OR: [
                        { connectionNumber: { equals: isNaN(Number(search)) ? undefined : Number(search) } },
                        { meter: { serialNumber: { contains: search, mode: "insensitive" } } },
                        {
                            customer: {
                                OR: [
                                    { customerName: { contains: search, mode: "insensitive" } },
                                    { accountNumber: { contains: search, mode: "insensitive" } },
                                    { phoneNumber: { contains: search, mode: "insensitive" } },
                                    { email: { contains: search, mode: "insensitive" } },
                                ],
                            },
                        },
                    ],
                }
                : {}),
        };
        const orderBy = sortBy === "customerName"
            ? { customer: { customerName: sortOrder } }
            : sortBy === "accountNumber"
                ? { customer: { accountNumber: sortOrder } }
                : sortBy === "meterSerial"
                    ? { meter: { serialNumber: sortOrder } }
                    : sortBy === "connectionNumber"
                        ? { connectionNumber: sortOrder }
                        : { createdAt: sortOrder };
        // Fetch data + total count
        const [connections, total] = await Promise.all([
            globalPrisma_1.default.connection.findMany({
                where,
                include: {
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
                    meter: {
                        select: {
                            id: true,
                            serialNumber: true,
                            model: true,
                            status: true,
                        },
                    },
                },
                orderBy,
                skip,
                take: limitNum,
            }),
            globalPrisma_1.default.connection.count({ where }),
        ]);
        // Send response with pagination
        res.json({
            message: "Connections retrieved successfully",
            data: connections,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
                hasNext: pageNum * limitNum < total,
                hasPrev: pageNum > 1,
            },
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getConnections = getConnections;
const getAvailableConnections = async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId)
            throw new Error("Tenant not found in request");
        const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc" } = req.query;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;
        // Only connections with no customer
        const where = {
            tenantId,
            customer: null, // <-- key filter
            ...(search
                ? {
                    OR: [
                        { connectionNumber: { equals: isNaN(Number(search)) ? undefined : Number(search) } },
                        { meter: { serialNumber: { contains: search, mode: "insensitive" } } },
                    ],
                }
                : {}),
        };
        // Map sortBy to Prisma orderBy
        const orderBy = sortBy === "connectionNumber"
            ? { connectionNumber: sortOrder }
            : sortBy === "meterSerial"
                ? { meter: { serialNumber: sortOrder } }
                : { createdAt: sortOrder };
        const [connections, total] = await Promise.all([
            globalPrisma_1.default.connection.findMany({
                where,
                include: {
                    meter: {
                        select: {
                            id: true,
                            serialNumber: true,
                            model: true,
                            status: true,
                        },
                    },
                },
                orderBy,
                skip,
                take: limitNum,
            }),
            globalPrisma_1.default.connection.count({ where }),
        ]);
        res.json({
            message: "Available connections retrieved successfully",
            data: connections,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
                hasNext: pageNum * limitNum < total,
                hasPrev: pageNum > 1,
            },
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAvailableConnections = getAvailableConnections;
// Get connection by ID
const getConnectionById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const connection = await globalPrisma_1.default.connection.findUnique({
            where: { id: Number(id) },
            include: { customer: true, meter: true },
        });
        if (!connection) {
            res.status(404).json({ message: "Connection not found" });
            return;
        }
        res.json({ message: "Connection retrieved", data: connection });
    }
    catch (err) {
        next(err);
    }
};
exports.getConnectionById = getConnectionById;
// Create a connection
const createConnection = async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId)
            throw new Error("Tenant not found in request");
        const { connectionNumber, customerId, status } = req.body;
        const newConnection = await globalPrisma_1.default.connection.create({
            data: {
                tenantId,
                connectionNumber,
                customerId,
                status: status,
            },
        });
        res.status(201).json({ message: "Connection created", data: newConnection });
    }
    catch (err) {
        next(err);
    }
};
exports.createConnection = createConnection;
// Update a connection
const updateConnection = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { connectionNumber, customerId, status } = req.body;
        const updated = await globalPrisma_1.default.connection.update({
            where: { id: Number(id) },
            data: { connectionNumber, customerId, status },
        });
        res.json({ message: "Connection updated", data: updated });
    }
    catch (err) {
        next(err);
    }
};
exports.updateConnection = updateConnection;
// Delete a connection
const deleteConnection = async (req, res, next) => {
    try {
        const { id } = req.params;
        await globalPrisma_1.default.connection.delete({ where: { id: Number(id) } });
        res.json({ message: "Connection deleted" });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteConnection = deleteConnection;
