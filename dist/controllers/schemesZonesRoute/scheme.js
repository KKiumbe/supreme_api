"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getZonesByScheme = exports.getAllSchemesWithZonesAndRoutes = exports.createScheme = void 0;
const globalPrisma_1 = __importDefault(require("../../globalPrisma"));
const createScheme = async (req, res, next) => {
    try {
        const { name } = req.body;
        const { tenantId } = req.user;
        if (!name) {
            res.status(400).json({ message: 'Scheme name is required' });
            return;
        }
        if (!tenantId) {
            res.status(403).json({ message: 'Tenant ID missing from user context' });
            return;
        }
        const scheme = await globalPrisma_1.default.scheme.create({
            data: {
                name,
                tenantId,
            },
        });
        res.status(201).json({
            message: 'Scheme created successfully',
            data: scheme,
        });
    }
    catch (error) {
        console.error('Error creating scheme:', error);
        next(error);
    }
};
exports.createScheme = createScheme;
// controllers/schemeController.ts
const getAllSchemesWithZonesAndRoutes = async (req, res) => {
    try {
        const tenantId = req.user?.tenantId;
        const schemes = await globalPrisma_1.default.scheme.findMany({
            where: { tenantId },
            include: {
                zones: {
                    include: {
                        routes: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({
            success: true,
            message: 'Schemes with zones and routes fetched successfully',
            data: schemes,
        });
    }
    catch (error) {
        console.error('Error fetching schemes with zones and routes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch schemes with zones and routes',
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.getAllSchemesWithZonesAndRoutes = getAllSchemesWithZonesAndRoutes;
// ✅ Fetch all zones belonging to a specific scheme
const getZonesByScheme = async (req, res, next) => {
    try {
        const { schemeId } = req.params;
        if (!schemeId) {
            res.status(400).json({ message: 'Scheme ID is required' });
            return;
        }
        const zones = await globalPrisma_1.default.zone.findMany({
            where: {
                schemeId: Number(schemeId),
            },
            include: {
                routes: true, // include routes if you want nested data
            },
            orderBy: { id: 'asc' },
        });
        res.status(200).json({
            message: 'Zones fetched successfully',
            data: zones,
        });
    }
    catch (error) {
        console.error('Error fetching zones by scheme:', error);
        next(error);
    }
};
exports.getZonesByScheme = getZonesByScheme;
