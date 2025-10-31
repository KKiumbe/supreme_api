import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/verifyToken";
import prisma from "../../../globalPrisma";
import { z } from "zod";

// ---------------------------------------------------------------------
// 1. Query Schema – validates & parses query params
// ---------------------------------------------------------------------
const GetCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  schemeId: z.coerce.number().int().optional(),
  zoneId: z.coerce.number().int().optional(),
  routeId: z.coerce.number().int().optional(),
  tariffCategoryId: z.string().uuid().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

type GetCustomersQuery = z.infer<typeof GetCustomersQuerySchema>;

// ---------------------------------------------------------------------
// 2. Controller: getCustomers
// ---------------------------------------------------------------------



export const getCustomers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: Tenant not found",
      });
      return;
    }

    // Parse and validate query
    const query = GetCustomersQuerySchema.parse(req.query);
    const { page, limit, search, schemeId, zoneId, routeId, tariffCategoryId, status } = query;
    const skip = (page - 1) * limit;

    // Build dynamic WHERE clause
    const where: any = {
      tenantId,
      ...(status && { status }),
      ...(schemeId && { customerSchemeId: schemeId }),
      ...(zoneId && { customerZoneId: zoneId }),
      ...(routeId && { customerRouteId: routeId }),
      ...(tariffCategoryId && { tariffCategoryId }),
      ...(search && {
        OR: [
          { customerName: { contains: search, mode: "insensitive" } },
          { accountNumber: { contains: search, mode: "insensitive" } },
          { phoneNumber: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    // Fetch customers with connections and meters
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          accountNumber: true,
          customerName: true,
          email: true,
          phoneNumber: true,
          status: true,
          customerKraPin: true,
          customerDob: true,
          customerDeposit: true,
          customerDiscoType: true,
          customerIdNo: true,
          hasSewer: true,
          hasWater: true,
          createdAt: true,
          customerSchemeId: true,
          customerZoneId: true,
          customerRouteId: true,
          tariffCategory: tariffCategoryId
            ? { select: { id: true, name: true } }
            : undefined,
          connections: {
            select: {
              connectionNumber: true,
              status: true,
              meter: {
                select: {
                  id: true,
                  serialNumber: true,
                  model: true,
                  status: true,
                  meterReadings: {
                    orderBy: { readingDate: "desc" },
                    take: 1, // latest reading
                  },
                },
              },
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      data: {
        customers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching customers:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: error.issues,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error.message || "Internal server error",
    });
  }
};



const GetNewCustomersQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  search: z.string().optional(),
  schemeId: z.string().optional(),
  zoneId: z.string().optional(),
  routeId: z.string().optional(),
  tariffCategoryId: z.string().optional(),
});

export const getNewCustomers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Tenant not found" });
    }

    const query = GetNewCustomersQuerySchema.parse(req.query);
    const { page, limit, search, schemeId, zoneId, routeId, tariffCategoryId } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      status: "NEW", // Only fetch new customers
      ...(schemeId && { customerSchemeId: schemeId }),
      ...(zoneId && { customerZoneId: zoneId }),
      ...(routeId && { customerRouteId: routeId }),
      ...(tariffCategoryId && { tariffCategoryId }),
      ...(search && {
        OR: [
          { customerName: { contains: search, mode: "insensitive" } },
          { accountNumber: { contains: search, mode: "insensitive" } },
          { phoneNumber: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          accountNumber: true,
          customerName: true,
          email: true,
          phoneNumber: true,
          status: true,
          customerKraPin: true,
          customerDob: true,
          customerDeposit: true,
          customerDiscoType: true,
          customerIdNo: true,
          hasSewer: true,
          hasWater: true,
          createdAt: true,
          customerSchemeId: true,
          customerZoneId: true,
          customerRouteId: true,
          tariffCategory: tariffCategoryId
            ? { select: { id: true, name: true } }
            : undefined,
        },
      }),
      prisma.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: "New customers fetched successfully",
      data: {
        customers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching new customers:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: error.issues,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch new customers",
      error: error.message || "Internal server error",
    });
  }
};
