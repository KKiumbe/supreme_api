import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/verifyToken';
import prisma from '../../globalPrisma'

// Types
interface CreateRouteBody {
  name: string;
  code?: string;
  zoneId: number;
}

export const createRoute = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, code, zoneId } = req.body as CreateRouteBody;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      res.status(401).json({ message: 'Unauthorized: Missing tenant context' });
      return;
    }

    if (!name || !zoneId) {
      res.status(400).json({ message: 'Route name and zoneId are required' });
      return;
    }

    // ✅ Ensure the Zone exists and belongs to the tenant through its Scheme
    const zone = await prisma.zone.findFirst({
      where: {
        id: zoneId,
        scheme: { tenantId },
      },
      include: { scheme: true },
    });

    if (!zone) {
      res.status(404).json({ message: 'Zone not found or does not belong to your tenant' });
      return;
    }

    // ✅ Create Route
    const route = await prisma.route.create({
      data: {
        name,
        
        zoneId,
      },
    });

    res.status(201).json({
      message: 'Route created successfully',
      data: route,
    });
  } catch (error) {
    console.error('Error creating route:', error);
    next(error);
  }
};
