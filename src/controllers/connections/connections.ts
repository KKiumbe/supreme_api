import { Response, NextFunction } from "express";
import prisma from "@/globalPrisma";

import { Prisma } from "@prisma/client";
import { AuthenticatedRequest } from "../../middleware/verifyToken";

// Get all connections for current tenant




export interface GetConnections {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'connectionNumber' | 'customerName' | 'accountNumber' | 'meterSerial';
  sortOrder?: 'asc' | 'desc';
}

export const getConnections = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Tenant not found in request");

    // Parse and validate query with defaults
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query as unknown as GetConnections;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build dynamic WHERE clause
    const where: Prisma.ConnectionWhereInput = {
      tenantId,
      ...(search
        ? {
            OR: [
              { connectionNumber: { equals: isNaN(Number(search)) ? undefined : Number(search) } },
              { meter: { serialNumber: { contains: search, mode: "insensitive" } } },
              {
                customer: {
                  OR: [
                    { customerName: { contains: search, mode: "insensitive" } },
                    { accountNumber: { contains: search, mode: "insensitive" } },
                    { phoneNumber: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    // Map sortBy to Prisma orderBy
    type SortField =
      | { createdAt: "asc" | "desc" }
      | { connectionNumber: "asc" | "desc" }
      | { customer: { customerName: "asc" | "desc" } }
      | { customer: { accountNumber: "asc" | "desc" } }
      | { meter: { serialNumber: "asc" | "desc" } };

    const orderBy: SortField =
      sortBy === "customerName"
        ? { customer: { customerName: sortOrder } }
        : sortBy === "accountNumber"
        ? { customer: { accountNumber: sortOrder } }
        : sortBy === "meterSerial"
        ? { meter: { serialNumber: sortOrder } }
        : sortBy === "connectionNumber"
        ? { connectionNumber: sortOrder }
        : { createdAt: sortOrder };

    // Fetch data + total count
    const [connections, total] = await Promise.all([
      prisma.connection.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              accountNumber: true,
              customerName: true,
              phoneNumber: true,
              email: true,
              status: true,
            },
          },
          meter: {
            select: {
              id: true,
              serialNumber: true,
              model: true,
              status: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.connection.count({ where }),
    ]);

    // Send response with pagination
    res.json({
      message: "Connections retrieved successfully",
      data: connections,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};





export const getAvailableConnections = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Tenant not found in request");

    const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc" } =
      req.query as unknown as GetConnections;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Only connections with no customer
    const where: any = {
      tenantId,
      customer: null, // <-- key filter
      ...(search
        ? {
            OR: [
              { connectionNumber: { equals: isNaN(Number(search)) ? undefined : Number(search) } },
              { meter: { serialNumber: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    // Map sortBy to Prisma orderBy
    const orderBy =
      sortBy === "connectionNumber"
        ? { connectionNumber: sortOrder }
        : sortBy === "meterSerial"
        ? { meter: { serialNumber: sortOrder } }
        : { createdAt: sortOrder };

    const [connections, total] = await Promise.all([
      prisma.connection.findMany({
        where,
        include: {
          meter: {
            select: {
              id: true,
              serialNumber: true,
              model: true,
              status: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.connection.count({ where }),
    ]);

    res.json({
      message: "Available connections retrieved successfully",
      data: connections,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get connection by ID
export const getConnectionById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const connection = await prisma.connection.findUnique({
      where: { id: Number(id) },
      include: { customer: true, meter: true },
    });

    if (!connection) {
      res.status(404).json({ message: "Connection not found" });
      return;
    }

    res.json({ message: "Connection retrieved", data: connection });
  } catch (err) {
    next(err);
  }
};

// Create a connection
export const createConnection = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Tenant not found in request");

    const { connectionNumber, customerId, status } = req.body;

    const newConnection = await prisma.connection.create({
      data: {
        tenantId,
        connectionNumber,
        customerId,
       
        status: status ,
      },
    });

    res.status(201).json({ message: "Connection created", data: newConnection });
  } catch (err) {
    next(err);
  }
};

// Update a connection
export const updateConnection = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { connectionNumber, customerId, status } = req.body;

    const updated = await prisma.connection.update({
      where: { id: Number(id) },
      data: { connectionNumber, customerId, status },
    });

    res.json({ message: "Connection updated", data: updated });
  } catch (err) {
    next(err);
  }
};

// Delete a connection
export const deleteConnection = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.connection.delete({ where: { id: Number(id) } });

    res.json({ message: "Connection deleted" });
  } catch (err) {
    next(err);
  }
};
