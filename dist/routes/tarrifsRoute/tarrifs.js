"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyToken_1 = __importDefault(require("../../middleware/verifyToken"));
const tarrifCategory_1 = require("../../controllers/tarrif/tarrifCategory");
const tarrifBlock_1 = require("../../controllers/tarrif/tarrifBlock");
const uploadTarrif_1 = require("../../controllers/tarrif/uploadTarrif");
const router = express_1.default.Router();
// ✅ Add new meter
router.post('/tarrifs/category/create', verifyToken_1.default, tarrifCategory_1.createTariffCategory);
router.post('/tarrifs/block/create', verifyToken_1.default, tarrifBlock_1.createTariffBlock);
router.get('/tarrifs/category', verifyToken_1.default, tarrifCategory_1.getAllTariffCategories);
router.get('/tarrifs/block', verifyToken_1.default, tarrifBlock_1.getAllTariffBlocks);
router.post('/tariffs/upload', verifyToken_1.default, uploadTarrif_1.uploadTariffExcelMiddleware, uploadTarrif_1.uploadTariffExcel);
exports.default = router;
