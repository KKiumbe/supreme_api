"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBills = void 0;
const globalPrisma_1 = __importDefault(require("@/globalPrisma"));
const getBills = async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { page = "1", limit = "10", search = "", billType, status, sortBy = "billPeriod", sortOrder = "desc", isSystemGenerated, } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))); // cap at 100
        const skip = (pageNum - 1) * limitNum;
        // Build dynamic WHERE clause
        const where = {
            tenantId,
            ...(status && { status }),
            ...(isSystemGenerated && {
                isSystemGenerated: isSystemGenerated === "true",
            }),
        };
        // Search across customer name, phone, connection number
        if (search.trim()) {
            where.OR = [
                {
                    customer: {
                        customerName: { contains: search.trim(), mode: "insensitive" },
                    },
                },
                {
                    customer: {
                        phoneNumber: { contains: search.trim(), mode: "insensitive" },
                    },
                },
                {
                    connection: {
                        connectionNumber: { equals: parseInt(search.trim()) || undefined },
                    },
                },
            ];
        }
        // Filter by bill type
        if (billType) {
            where.type = {
                name: { contains: billType, mode: "insensitive" },
            };
        }
        // Validate sort field
        const validSortFields = ["billPeriod", "billAmount", "createdAt"];
        const orderBy = validSortFields.includes(sortBy)
            ? { [sortBy]: sortOrder }
            : { billPeriod: "desc" };
        // Execute count + data in parallel
        const [total, bills] = await Promise.all([
            globalPrisma_1.default.bill.count({ where }),
            globalPrisma_1.default.bill.findMany({
                where,
                skip,
                take: limitNum,
                orderBy,
                select: {
                    id: true,
                    billNumber: true,
                    billAmount: true,
                    amountPaid: true,
                    closingBalance: true,
                    status: true,
                    billPeriod: true,
                    isSystemGenerated: true,
                    createdAt: true,
                    customer: {
                        select: {
                            id: true,
                            accountNumber: true,
                            customerName: true,
                            phoneNumber: true,
                        },
                    },
                    // Removed 'connection' property as it does not exist in BillSelect<DefaultArgs>
                    type: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    items: {
                        select: {
                            description: true,
                            quantity: true,
                            amount: true,
                        },
                    },
                },
            }),
        ]);
        const totalPages = Math.ceil(total / limitNum);
        res.status(200).json({
            success: true,
            data: bills,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1,
            },
            filters: {
                search: search.trim() || null,
                billType: billType || null,
                status: status || null,
            },
        });
    }
    catch (error) {
        console.error("Error fetching bills:", error);
        next(error);
    }
};
exports.getBills = getBills;
