import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/verifyToken";
import prisma from '../../globalPrisma'
import { MeterResponse } from "./types";




export const getMeter = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: Tenant not found",
      });
      return;
    }

    // Validate meter ID
    const meterId = parseInt(id, 10);
    if (isNaN(meterId) || meterId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid meter ID. Must be a positive integer.",
      });
      return;
    }

    // Fetch meter with relations
    const meter = await prisma.meter.findFirst({
      where: {
        id: meterId,
        tenantId,
      },
      include: {
        connection: {
          include: {
            customer: {
              select: {
                id: true,
                customerName: true,
                accountNumber: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!meter) {
      res.status(404).json({
        success: false,
        message: "Meter not found or does not belong to your tenant",
      });
      return;
    }

    // Map to MeterResponse
    const response: MeterResponse = {
      id: meter.id,
      serialNumber: meter.serialNumber,
      model: meter.model,
      installationDate: meter.installationDate ?? null,
      lastInspectedAt: meter.lastInspectedAt ?? null,
      status: meter.status ?? "",
      meterSize: meter.meterSize?.toNumber() ?? null,
      createdAt: meter.createdAt,
      tenantId: meter.tenantId,
      connectionId: meter.connectionId ?? null,
      meta: typeof meter.meta === "object" && meter.meta !== null ? meter.meta : {},
      connection: meter.connection
        ? {
            id: meter.connection.id,
            connectionNumber: meter.connection.connectionNumber,
            customer: meter.connection.customer
              ? {
                  id: meter.connection.customer.id,
                  customerName: meter.connection.customer.customerName,
                  accountNumber: meter.connection.customer.accountNumber,
                }
              : null,
          }
        : null,
    };

    res.status(200).json({
      success: true,
      message: "Meter fetched successfully",
      data: response,
    });
  } catch (error: any) {
    console.error("Error fetching meter:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch meter",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
