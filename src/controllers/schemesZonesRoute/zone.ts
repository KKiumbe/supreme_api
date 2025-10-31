import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/verifyToken';

import prisma from "@/globalPrisma";
// Types
interface CreateZoneBody {
  name: string;
  schemeId: number;
}

// Controller
export const createZone = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, schemeId } = req.body as CreateZoneBody;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      res.status(401).json({ message: 'Unauthorized: Missing tenant context' });
      return;
    }

    if (!name || !schemeId) {
      res.status(400).json({ message: 'Zone name and schemeId are required' });
      return;
    }

    // ✅ Ensure the scheme exists and belongs to this tenant
    const scheme = await prisma.scheme.findFirst({
      where: { id: schemeId, tenantId },
    });

    if (!scheme) {
      res.status(404).json({ message: 'Scheme not found or does not belong to your tenant' });
      return;
    }

    // ✅ Create Zone
    const zone = await prisma.zone.create({
      data: {
        name,
        schemeId,
      },
    });

    res.status(201).json({
      message: 'Zone created successfully',
      data: zone,
    });
  } catch (error) {
    console.error('Error creating zone:', error);
    next(error);
  }
};




export const getRoutesByZoneId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { zoneId } = req.params;
    const {tenantId} = req.user!;

    if (!zoneId) {
      res.status(400).json({ success: false, message: 'Zone ID is required' });
      return;
    }

    const routes = await prisma.route.findMany({
      where: {
        zoneId: Number(zoneId),
        zone: {
          scheme: {
            tenantId,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      message: 'Routes fetched successfully',
      data: routes,
    });
  } catch (error) {
    console.error('Error fetching routes by zone ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routes',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
