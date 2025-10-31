"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeters = void 0;
const globalPrisma_1 = __importDefault(require("@/globalPrisma"));
const getMeters = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: Tenant not found",
            });
            return;
        }
        // Parse query params
        const rawQuery = req.query;
        const query = {
            page: rawQuery.page ? parseInt(rawQuery.page, 10) : 1,
            limit: rawQuery.limit ? parseInt(rawQuery.limit, 10) : 20,
            search: typeof rawQuery.search === "string" ? rawQuery.search.trim() : undefined,
            status: rawQuery.status,
            connectionId: rawQuery.connectionId ? parseInt(rawQuery.connectionId, 10) : undefined,
            customerId: typeof rawQuery.customerId === "string" ? rawQuery.customerId : undefined,
        };
        // Validate pagination
        if (typeof query.page !== "number" || isNaN(query.page) || query.page < 1)
            query.page = 1;
        if (typeof query.limit !== "number" || isNaN(query.limit) || query.limit < 1 || query.limit > 100)
            query.limit = 20;
        const skip = ((query.page ?? 1) - 1) * (query.limit ?? 20);
        // Build WHERE clause
        const where = { tenantId };
        if (query.status)
            where.status = query.status;
        if (query.connectionId !== undefined)
            where.connectionId = query.connectionId;
        if (query.search) {
            where.OR = [
                { serialNumber: { contains: query.search, mode: "insensitive" } },
                { model: { contains: query.search, mode: "insensitive" } },
            ];
        }
        if (query.customerId) {
            where.connection = { customerId: query.customerId };
        }
        // Fetch meters and count
        const [meters, total] = await Promise.all([
            globalPrisma_1.default.meter.findMany({
                where,
                skip,
                take: query.limit,
                orderBy: { createdAt: "desc" },
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
            }),
            globalPrisma_1.default.meter.count({ where }),
        ]);
        const totalPages = Math.ceil(total / query.limit);
        // Map to MeterResponse type
        const response = {
            meters: meters.map((meter) => ({
                id: meter.id,
                serialNumber: meter.serialNumber,
                model: meter.model ?? null,
                installationDate: meter.installationDate ?? null,
                lastInspectedAt: meter.lastInspectedAt ?? null,
                status: meter.status ?? "",
                meterSize: meter.meterSize !== null && meter.meterSize !== undefined ? Number(meter.meterSize) : null,
                createdAt: meter.createdAt,
                tenantId: meter.tenantId,
                connectionId: meter.connectionId ?? null,
                meta: typeof meter.meta === "object" && meter.meta !== null && !Array.isArray(meter.meta)
                    ? meter.meta
                    : {},
                connection: meter.connection
                    ? {
                        id: meter.connection.id,
                        connectionNumber: meter.connection.connectionNumber,
                        customer: meter.connection.customer
                            ? {
                                id: meter.connection.customer.id,
                                customerName: meter.connection.customer.customerName,
                                accountNumber: meter.connection.customer.accountNumber,
                            }
                            : null,
                    }
                    : null,
            })),
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages,
                hasNext: query.page < totalPages,
                hasPrev: query.page > 1,
            },
        };
        res.status(200).json({
            success: true,
            message: "Meters fetched successfully",
            data: response,
        });
    }
    catch (error) {
        console.error("Error fetching meters:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch meters",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.getMeters = getMeters;
