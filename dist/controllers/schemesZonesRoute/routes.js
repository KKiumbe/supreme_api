"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoute = void 0;
const globalPrisma_1 = __importDefault(require("../../globalPrisma"));
const createRoute = async (req, res, next) => {
    try {
        const { name, code, zoneId } = req.body;
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            res.status(401).json({ message: 'Unauthorized: Missing tenant context' });
            return;
        }
        if (!name || !zoneId) {
            res.status(400).json({ message: 'Route name and zoneId are required' });
            return;
        }
        // ✅ Ensure the Zone exists and belongs to the tenant through its Scheme
        const zone = await globalPrisma_1.default.zone.findFirst({
            where: {
                id: zoneId,
                scheme: { tenantId },
            },
            include: { scheme: true },
        });
        if (!zone) {
            res.status(404).json({ message: 'Zone not found or does not belong to your tenant' });
            return;
        }
        // ✅ Create Route
        const route = await globalPrisma_1.default.route.create({
            data: {
                name,
                zoneId,
            },
        });
        res.status(201).json({
            message: 'Route created successfully',
            data: route,
        });
    }
    catch (error) {
        console.error('Error creating route:', error);
        next(error);
    }
};
exports.createRoute = createRoute;
