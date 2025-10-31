"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNewCustomers = exports.getCustomers = void 0;
const globalPrisma_1 = __importDefault(require("@/globalPrisma"));
const zod_1 = require("zod");
// ---------------------------------------------------------------------
// 1. Query Schema – validates & parses query params
// ---------------------------------------------------------------------
const GetCustomersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    schemeId: zod_1.z.coerce.number().int().optional(),
    zoneId: zod_1.z.coerce.number().int().optional(),
    routeId: zod_1.z.coerce.number().int().optional(),
    tariffCategoryId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(["active", "inactive"]).optional(),
});
// ---------------------------------------------------------------------
// 2. Controller: getCustomers
// ---------------------------------------------------------------------
const getCustomers = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: Tenant not found",
            });
            return;
        }
        // Parse and validate query
        const query = GetCustomersQuerySchema.parse(req.query);
        const { page, limit, search, schemeId, zoneId, routeId, tariffCategoryId, status } = query;
        const skip = (page - 1) * limit;
        // Build dynamic WHERE clause
        const where = {
            tenantId,
            ...(status && { status }),
            ...(schemeId && { customerSchemeId: schemeId }),
            ...(zoneId && { customerZoneId: zoneId }),
            ...(routeId && { customerRouteId: routeId }),
            ...(tariffCategoryId && { tariffCategoryId }),
            ...(search && {
                OR: [
                    { customerName: { contains: search, mode: "insensitive" } },
                    { accountNumber: { contains: search, mode: "insensitive" } },
                    { phoneNumber: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                ],
            }),
        };
        // Fetch customers with connections and meters
        const [customers, total] = await Promise.all([
            globalPrisma_1.default.customer.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    accountNumber: true,
                    customerName: true,
                    email: true,
                    phoneNumber: true,
                    status: true,
                    customerKraPin: true,
                    customerDob: true,
                    customerDeposit: true,
                    customerDiscoType: true,
                    customerIdNo: true,
                    hasSewer: true,
                    hasWater: true,
                    createdAt: true,
                    customerSchemeId: true,
                    customerZoneId: true,
                    customerRouteId: true,
                    tariffCategory: tariffCategoryId
                        ? { select: { id: true, name: true } }
                        : undefined,
                    connections: {
                        select: {
                            connectionNumber: true,
                            status: true,
                            meter: {
                                select: {
                                    id: true,
                                    serialNumber: true,
                                    model: true,
                                    status: true,
                                    meterReadings: {
                                        orderBy: { readingDate: "desc" },
                                        take: 1, // latest reading
                                    },
                                },
                            },
                        },
                    },
                },
            }),
            globalPrisma_1.default.customer.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        res.status(200).json({
            success: true,
            message: "Customers fetched successfully",
            data: {
                customers,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            },
        });
    }
    catch (error) {
        console.error("Error fetching customers:", error);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                errors: error.issues,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Failed to fetch customers",
            error: error.message || "Internal server error",
        });
    }
};
exports.getCustomers = getCustomers;
const GetNewCustomersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().default(1),
    limit: zod_1.z.coerce.number().default(20),
    search: zod_1.z.string().optional(),
    schemeId: zod_1.z.string().optional(),
    zoneId: zod_1.z.string().optional(),
    routeId: zod_1.z.string().optional(),
    tariffCategoryId: zod_1.z.string().optional(),
});
const getNewCustomers = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Tenant not found" });
        }
        const query = GetNewCustomersQuerySchema.parse(req.query);
        const { page, limit, search, schemeId, zoneId, routeId, tariffCategoryId } = query;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            status: "NEW", // Only fetch new customers
            ...(schemeId && { customerSchemeId: schemeId }),
            ...(zoneId && { customerZoneId: zoneId }),
            ...(routeId && { customerRouteId: routeId }),
            ...(tariffCategoryId && { tariffCategoryId }),
            ...(search && {
                OR: [
                    { customerName: { contains: search, mode: "insensitive" } },
                    { accountNumber: { contains: search, mode: "insensitive" } },
                    { phoneNumber: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                ],
            }),
        };
        const [customers, total] = await Promise.all([
            globalPrisma_1.default.customer.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    accountNumber: true,
                    customerName: true,
                    email: true,
                    phoneNumber: true,
                    status: true,
                    customerKraPin: true,
                    customerDob: true,
                    customerDeposit: true,
                    customerDiscoType: true,
                    customerIdNo: true,
                    hasSewer: true,
                    hasWater: true,
                    createdAt: true,
                    customerSchemeId: true,
                    customerZoneId: true,
                    customerRouteId: true,
                    tariffCategory: tariffCategoryId
                        ? { select: { id: true, name: true } }
                        : undefined,
                },
            }),
            globalPrisma_1.default.customer.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        res.status(200).json({
            success: true,
            message: "New customers fetched successfully",
            data: {
                customers,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            },
        });
    }
    catch (error) {
        console.error("Error fetching new customers:", error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                errors: error.issues,
            });
        }
        res.status(500).json({
            success: false,
            message: "Failed to fetch new customers",
            error: error.message || "Internal server error",
        });
    }
};
exports.getNewCustomers = getNewCustomers;
