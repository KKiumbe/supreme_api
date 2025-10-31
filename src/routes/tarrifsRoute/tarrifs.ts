import express from 'express';
import { createMeter } from '../../controllers/meterManagement/createMeter';
import verifyToken from '../../middleware/verifyToken';
import { createTariffCategory, getAllTariffCategories } from '../../controllers/tarrif/tarrifCategory';
import { createTariffBlock, getAllTariffBlocks } from '../../controllers/tarrif/tarrifBlock';
import { uploadTariffExcel, uploadTariffExcelMiddleware } from '../../controllers/tarrif/uploadTarrif';


const router = express.Router();

// ✅ Add new meter
router.post('/tarrifs/category/create', verifyToken, createTariffCategory);

router.post('/tarrifs/block/create', verifyToken, createTariffBlock);

router.get('/tarrifs/category', verifyToken, getAllTariffCategories);

router.get('/tarrifs/block', verifyToken, getAllTariffBlocks);
router.post(
  '/tariffs/upload',
  verifyToken,
  uploadTariffExcelMiddleware,
  uploadTariffExcel
);



export default router;
