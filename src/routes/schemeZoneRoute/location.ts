import express from 'express';
import verifyToken from '../../middleware/verifyToken';
import { createScheme, getAllSchemesWithZonesAndRoutes, getZonesByScheme } from '../../controllers/schemesZonesRoute/scheme';
import { createZone, getRoutesByZoneId } from '../../controllers/schemesZonesRoute/zone';
import { createRoute } from '../../controllers/schemesZonesRoute/routes';

const router = express.Router();

// ✅ Add new meter
router.post('/schemes/create', verifyToken, createScheme);

router.get('/schemes', verifyToken, getAllSchemesWithZonesAndRoutes);

router.get('/schemes/:schemeId', verifyToken, getZonesByScheme);



router.post('/zones/create', verifyToken, createZone);

router.get('/zones/:zoneId/routes', verifyToken, getRoutesByZoneId);


router.post('/routes/create', verifyToken, createRoute);







export default router;
