import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/verifyToken";
import prisma from '../../globalPrisma'

export const createTariffCategory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.body;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      res.status(401).json({ message: "Unauthorized - Missing tenant context" });
      return;
    }

    if (!name) {
      res.status(400).json({ message: "Tariff name is required" });
      return;
    }

    const existing = await prisma.tariffCategory.findFirst({
      where: { name },
    });

    if (existing) {
      res.status(400).json({ message: "Tariff category already exists" });
      return;
    }

    const tariffCategory = await prisma.tariffCategory.create({
      data: {
        name,
        tenantId
        
      },
    });

    res.status(201).json({
      message: "Tariff category created successfully",
      data: tariffCategory,
    });
  } catch (error) {
    console.error("Error creating tariff category:", error);
    next(error);
  }
};




// ✅ Fetch all tariff categories (with their blocks)
export const getAllTariffCategories = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      res.status(401).json({ message: "Unauthorized - Missing tenant context" });
      return;
    }

    const categories = await prisma.tariffCategory.findMany({
      where: { tenantId },
      include: {
        blocks: {
          orderBy: { minVolume: "asc" }, // optional, to list in logical order
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.status(200).json({
      message: "Tariff categories fetched successfully",
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching tariff categories:", error);
    next(error);
  }
};

