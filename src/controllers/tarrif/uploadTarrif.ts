import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import { AuthenticatedRequest } from '../../middleware/verifyToken';
import prisma from '../../globalPrisma'

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

// Middleware export for routes
export const uploadTariffExcelMiddleware = upload.single('file');

export const uploadTariffExcel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const tenantId = req.user?.tenantId;
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = XLSX.utils.sheet_to_json(sheetName ? workbook.Sheets[sheetName] : {});

    // Example expected columns in Excel:
    // Category | MinVolume | MaxVolume | RatePerUnit

    const groupedData: Record<string, any[]> = {};

    for (const row of sheet as any[]) {
      const categoryName = row['Category'];
      if (!categoryName) continue;

      if (!groupedData[categoryName]) groupedData[categoryName] = [];
      groupedData[categoryName].push({
        minVolume: parseFloat(row['MinVolume']),
        maxVolume: parseFloat(row['MaxVolume']),
        ratePerUnit: parseFloat(row['RatePerUnit']),
      });
    }

    // Save categories and blocks
    for (const [categoryName, blocks] of Object.entries(groupedData)) {
      // First, try to find the category by name and tenantId
      let category = await prisma.tariffCategory.findFirst({
        where: {
          name: categoryName,
          tenantId: tenantId!,
        },
      });

      // If not found, create it
      if (!category) {
        category = await prisma.tariffCategory.create({
          data: {
            name: categoryName,
            tenantId: tenantId!,
          },
        });
      }

      for (const block of blocks) {
        await prisma.tariffBlock.create({
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
  } catch (error) {
    console.error('Error uploading tariffs:', error);
    next(error);
  }
};
