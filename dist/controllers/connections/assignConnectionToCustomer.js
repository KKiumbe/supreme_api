"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignConnection = void 0;
const globalPrisma_1 = __importDefault(require("@/globalPrisma"));
const zod_1 = require("zod");
// Request body validation
const AssignConnectionSchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid(),
    connectionId: zod_1.z.int(),
});
const assignConnection = async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        if (!tenantId || !userId) {
            res.status(401).json({ success: false, message: "Unauthorized: Tenant or user not found" });
            return;
        }
        const { customerId, connectionId } = AssignConnectionSchema.parse(req.body);
        // Convert connectionId to number for prisma update
        const connectionIdNumber = Number(connectionId);
        // Fetch customer
        const customer = await globalPrisma_1.default.customer.findUnique({
            where: { id: customerId },
            include: { connections: true },
        });
        if (!customer) {
            res.status(404).json({ success: false, message: "Customer not found" });
            return;
        }
        if (customer.status === "ACTIVE") {
            res.status(400).json({ success: false, message: "Customer is already active" });
            return;
        }
        // Fetch connection
        const connection = await globalPrisma_1.default.connection.findUnique({
            where: { id: connectionId },
        });
        if (!connection) {
            res.status(404).json({ success: false, message: "Connection not found" });
            return;
        }
        if (connection.customerId) {
            res.status(400).json({ success: false, message: "Connection is already assigned" });
            return;
        }
        await Promise.all([
            globalPrisma_1.default.connection.update({
                where: { id: connectionIdNumber },
                data: { customerId: customerId },
            }),
            globalPrisma_1.default.customer.update({
                where: { id: customerId },
                data: {
                    status: "ACTIVE",
                    updatedAt: new Date(),
                    updatedBy: userId,
                },
            }),
        ]);
        res.status(200).json({
            success: true,
            message: "Connection assigned successfully and customer activated",
        });
    }
    catch (error) {
        console.error("Assign Connection Error:", error);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                message: "Invalid request",
                errors: error.issues,
            });
            return;
        }
        next(error); // global error handler
    }
};
exports.assignConnection = assignConnection;
