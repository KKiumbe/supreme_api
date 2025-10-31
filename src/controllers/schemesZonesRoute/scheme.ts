import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/verifyToken';
import prisma from '../../../globalPrisma';

export const createScheme = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.body;
  
      const { tenantId } = req.user!;

    if (!name) {
      res.status(400).json({ message: 'Scheme name is required' });
      return;
    }

    if (!tenantId) {
      res.status(403).json({ message: 'Tenant ID missing from user context' });
      return;
    }

    const scheme = await prisma.scheme.create({
      data: {
        name,
        tenantId,
      },
    });

    res.status(201).json({
      message: 'Scheme created successfully',
      data: scheme,
    });
  } catch (error) {
    console.error('Error creating scheme:', error);
    next(error);
  }
};




// controllers/schemeController.ts

export const getAllSchemesWithZonesAndRoutes = async (
  req: AuthenticatedRequest,
  res: Response
  
): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;

    const schemes = await prisma.scheme.findMany({
      where: { tenantId },
      include: {
        zones: {
          include: {
            routes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      message: 'Schemes with zones and routes fetched successfully',
      data: schemes,
    });
  } catch (error) {
    console.error('Error fetching schemes with zones and routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schemes with zones and routes',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};



// ✅ Fetch all zones belonging to a specific scheme
export const getZonesByScheme = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { schemeId } = req.params;

    if (!schemeId) {
      res.status(400).json({ message: 'Scheme ID is required' });
      return;
    }

    const zones = await prisma.zone.findMany({
      where: {
        schemeId: Number(schemeId),
        
      
      },
      include: {
        routes: true, // include routes if you want nested data
      },
      orderBy: { id: 'asc' },
    });

    res.status(200).json({
      message: 'Zones fetched successfully',
      data: zones,
    });
  } catch (error) {
    console.error('Error fetching zones by scheme:', error);
    next(error);
  }
};
