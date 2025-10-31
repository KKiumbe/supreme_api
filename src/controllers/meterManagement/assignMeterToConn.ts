
import { NextFunction, Response } from "express";
import prisma from '../../globalPrisma'
import { AuthenticatedRequest } from "../../middleware/verifyToken";
// Assign a meter to a connection
export const assignMeterToConnection = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { connectionId, meterId } = req.body;
  const tenantId = req.user?.tenantId;

  if (!connectionId || !meterId) {
    res.status(400).json({ message: "connectionId and meterId are required" });
    return;
  }

  try {
    // Check if meter belongs to tenant
    const meter = await prisma.meter.findFirst({
      where: { id: meterId, tenantId },
    });
    if (!meter) {
      res.status(404).json({ message: "Meter not found" });
      return;
    }

    // Check if connection belongs to tenant
    const connection = await prisma.connection.findFirst({
      where: { id: connectionId, tenantId },
    });
    if (!connection) {
      res.status(404).json({ message: "Connection not found" });
      return;
    }

    // Assign meter to connection
    const updatedMeter = await prisma.meter.update({
      where: { id: meterId },
      data: { connectionId: connectionId },
    });

    res.status(200).json({
      message: "Meter assigned to connection successfully",
      data: updatedMeter,
    });
  } catch (err) {
    next(err);
  }
};
