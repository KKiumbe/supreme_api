import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/verifyToken";
import prisma from "../../../globalPrisma";

export const createTariffBlock = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { categoryId, minVolume, maxVolume, ratePerUnit } = req.body;

    if (!categoryId || minVolume == null || ratePerUnit == null) {
      res.status(400).json({
        message: "categoryId, minVolume, and ratePerUnit are required",
      });
      return;
    }

    // ✅ Ensure tariff category exists for this tenant
    const tenantId = req.user?.tenantId;
    const category = await prisma.tariffCategory.findFirst({
      where: { id: categoryId, tenantId },
    });

    if (!category) {
      res.status(404).json({ message: "Tariff category not found" });
      return;
    }

    const tariffBlock = await prisma.tariffBlock.create({
      data: {
        categoryId,
        minVolume: parseFloat(minVolume),
        maxVolume: maxVolume ? parseFloat(maxVolume) : null,
        ratePerUnit: parseFloat(ratePerUnit),
      },
    });

    res.status(201).json({
      message: "Tariff block added successfully",
      data: tariffBlock,
    });
  } catch (error) {
    console.error("Error creating tariff block:", error);
    next(error);
  }
};



export const getAllTariffBlocks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;

    const blocks = await prisma.tariffBlock.findMany({
      where: {
        category: {
          tenantId,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        minVolume: 'asc',
      },
    });

    res.status(200).json({
      message: 'Tariff blocks fetched successfully',
      data: blocks,
    });
  } catch (error) {
    console.error('Error fetching tariff blocks:', error);
    next(error);
  }
};

