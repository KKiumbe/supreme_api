// src/controllers/billType.controller.ts
import { Request, Response, NextFunction } from "express";
import prisma from "../../../globalPrisma";
import { AuthenticatedRequest } from "../../middleware/verifyToken";

interface CreateBillTypeBody {
  name: string;
}

export const createBillType = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const { name } = req.body as CreateBillTypeBody;

    // 1. Auth check
    if (!tenantId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // 2. Validate input
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: "Bill type name is required and must be at least 2 characters.",
      });
      return;
    }

    const trimmedName = name.trim();

    // 3. Check for duplicate (per tenant)
    const existing = await prisma.billType.findFirst({
      where: {
        tenantId,
        name: {
          equals: trimmedName,
          mode: "insensitive", // case-insensitive
        },
      },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: `Bill type "${trimmedName}" already exists.`,
      });
      return;
    }

    // 4. Create bill type
    const billType = await prisma.billType.create({
      data: {
        tenantId,
        name: trimmedName,
      },
      select: {
        id: true,
        name: true,
        tenantId: true,
        
      },
    });

    res.status(201).json({
      success: true,
      message: "Bill type created successfully.",
      data: billType,
    });
  } catch (error: any) {
    console.error("Error creating bill type:", {
      tenantId: req.user?.tenantId,
      body: req.body,
      error: error.message,
    });

    // Handle Prisma unique constraint violation
    if (error.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "A bill type with this name already exists.",
      });
      return;
    }

    next(error);
  }
};


export const getBillTypes = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const types = await prisma.billType.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  res.json({ success: true, data: types });
};