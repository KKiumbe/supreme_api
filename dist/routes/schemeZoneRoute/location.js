"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyToken_1 = __importDefault(require("../../middleware/verifyToken"));
const scheme_1 = require("../../controllers/schemesZonesRoute/scheme");
const zone_1 = require("../../controllers/schemesZonesRoute/zone");
const routes_1 = require("../../controllers/schemesZonesRoute/routes");
const router = express_1.default.Router();
// ✅ Add new meter
router.post('/schemes/create', verifyToken_1.default, scheme_1.createScheme);
router.get('/schemes', verifyToken_1.default, scheme_1.getAllSchemesWithZonesAndRoutes);
router.get('/schemes/:schemeId', verifyToken_1.default, scheme_1.getZonesByScheme);
router.post('/zones/create', verifyToken_1.default, zone_1.createZone);
router.get('/zones/:zoneId/routes', verifyToken_1.default, zone_1.getRoutesByZoneId);
router.post('/routes/create', verifyToken_1.default, routes_1.createRoute);
exports.default = router;
