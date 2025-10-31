import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/verifyToken";
import prisma from '../../globalPrisma'
import { z } from "zod";

// Request body validation
const AssignConnectionSchema = z.object({
  customerId: z.string().uuid(),
  connectionId: z.int(),
});



export const assignConnection = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      res.status(401).json({ success: false, message: "Unauthorized: Tenant or user not found" });
      return;
    }

    const { customerId, connectionId } = AssignConnectionSchema.parse(req.body);

    // Convert connectionId to number for prisma update
    const connectionIdNumber = Number(connectionId);

    // Fetch customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { connections: true },
    });

    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found" });
      return;
    }

    if (customer.status === "ACTIVE") {
      res.status(400).json({ success: false, message: "Customer is already active" });
      return;
    }

    // Fetch connection
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      res.status(404).json({ success: false, message: "Connection not found" });
      return;
    }

    if (connection.customerId) {
      res.status(400).json({ success: false, message: "Connection is already assigned" });
      return;
    }

    await Promise.all([
      prisma.connection.update({
        where: { id: connectionIdNumber },
        data: { customerId: customerId },
      }),
      prisma.customer.update({
        where: { id: customerId },
        data: {
          status: "ACTIVE",
          updatedAt: new Date(),
          updatedBy: userId,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "Connection assigned successfully and customer activated",
    });
  } catch (error: any) {
    console.error("Assign Connection Error:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Invalid request",
        errors: error.issues,
      });
      return;
    }

    next(error); // global error handler
  }
};
