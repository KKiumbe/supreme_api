import { NextFunction, Request, Response } from 'express';
import prisma from '../../globalPrisma'
import { AuthenticatedRequest } from '../../middleware/verifyToken';

// ✅ Create Meter
export const createMeter = async (  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {

  const { tenantId } = req.user!;

  try {
    const {
      serialNumber,
      model,
      installationDate,
      lastInspectedAt,
      status,
      meta,
      meterSize,
      
      connectionId,
    } = req.body;

    // Validate required fields
    if (!serialNumber || !tenantId) {
     res.status(400).json({ message: 'serialNumber and tenantId are required.' });
    }

    const newMeter = await prisma.meter.create({
      data: {
        serialNumber,
        model,
        installationDate: installationDate ? new Date(installationDate) : null,
        lastInspectedAt: lastInspectedAt ? new Date(lastInspectedAt) : null,
        status: status || 'installed',
        meta: meta ? JSON.parse(meta) : {},
        meterSize,
        tenantId,
        connectionId,
      },
    });

    res.status(201).json({
      message: 'Meter created successfully',
      data: newMeter,
    });
  } catch (error: any) {
    console.error('Error creating meter:', error);
    res.status(500).json({
      message: 'Failed to create meter',
      error: error.message,
    });
  }
};
