"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadTariffExcel = exports.uploadTariffExcelMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const xlsx_1 = __importDefault(require("xlsx"));
const globalPrisma_1 = __importDefault(require("../../globalPrisma"));
// Configure multer for file upload
const upload = (0, multer_1.default)({ dest: 'uploads/' });
// Middleware export for routes
exports.uploadTariffExcelMiddleware = upload.single('file');
const uploadTariffExcel = async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        const tenantId = req.user?.tenantId;
        const workbook = xlsx_1.default.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = xlsx_1.default.utils.sheet_to_json(sheetName ? workbook.Sheets[sheetName] : {});
        // Example expected columns in Excel:
        // Category | MinVolume | MaxVolume | RatePerUnit
        const groupedData = {};
        for (const row of sheet) {
            const categoryName = row['Category'];
            if (!categoryName)
                continue;
            if (!groupedData[categoryName])
                groupedData[categoryName] = [];
            groupedData[categoryName].push({
                minVolume: parseFloat(row['MinVolume']),
                maxVolume: parseFloat(row['MaxVolume']),
                ratePerUnit: parseFloat(row['RatePerUnit']),
            });
        }
        // Save categories and blocks
        for (const [categoryName, blocks] of Object.entries(groupedData)) {
            // First, try to find the category by name and tenantId
            let category = await globalPrisma_1.default.tariffCategory.findFirst({
                where: {
                    name: categoryName,
                    tenantId: tenantId,
                },
            });
            // If not found, create it
            if (!category) {
                category = await globalPrisma_1.default.tariffCategory.create({
                    data: {
                        name: categoryName,
                        tenantId: tenantId,
                    },
                });
            }
            for (const block of blocks) {
                await globalPrisma_1.default.tariffBlock.create({
                    data: {
                        categoryId: category.id,
                        minVolume: block.minVolume,
                        maxVolume: block.maxVolume || null,
                        ratePerUnit: block.ratePerUnit,
                    },
                });
            }
        }
        res.status(201).json({
            message: 'Tariffs uploaded successfully',
        });
    }
    catch (error) {
        console.error('Error uploading tariffs:', error);
        next(error);
    }
};
exports.uploadTariffExcel = uploadTariffExcel;
