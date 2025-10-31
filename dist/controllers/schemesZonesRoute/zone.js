"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoutesByZoneId = exports.createZone = void 0;
const globalPrisma_1 = __importDefault(require("../../globalPrisma"));
// Controller
const createZone = async (req, res, next) => {
    try {
        const { name, schemeId } = req.body;
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            res.status(401).json({ message: 'Unauthorized: Missing tenant context' });
            return;
        }
        if (!name || !schemeId) {
            res.status(400).json({ message: 'Zone name and schemeId are required' });
            return;
        }
        // ✅ Ensure the scheme exists and belongs to this tenant
        const scheme = await globalPrisma_1.default.scheme.findFirst({
            where: { id: schemeId, tenantId },
        });
        if (!scheme) {
            res.status(404).json({ message: 'Scheme not found or does not belong to your tenant' });
            return;
        }
        // ✅ Create Zone
        const zone = await globalPrisma_1.default.zone.create({
            data: {
                name,
                schemeId,
            },
        });
        res.status(201).json({
            message: 'Zone created successfully',
            data: zone,
        });
    }
    catch (error) {
        console.error('Error creating zone:', error);
        next(error);
    }
};
exports.createZone = createZone;
const getRoutesByZoneId = async (req, res, next) => {
    try {
        const { zoneId } = req.params;
        const { tenantId } = req.user;
        if (!zoneId) {
            res.status(400).json({ success: false, message: 'Zone ID is required' });
            return;
        }
        const routes = await globalPrisma_1.default.route.findMany({
            where: {
                zoneId: Number(zoneId),
                zone: {
                    scheme: {
                        tenantId,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({
            success: true,
            message: 'Routes fetched successfully',
            data: routes,
        });
    }
    catch (error) {
        console.error('Error fetching routes by zone ID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch routes',
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.getRoutesByZoneId = getRoutesByZoneId;
