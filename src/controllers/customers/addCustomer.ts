import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/verifyToken";
import prisma from '../../globalPrisma'
import { CreateCustomerInput } from "./types";

// Create Customer Controller
export const createCustomer = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      accountNumber,
      customerName,
      email,
      phoneNumber,
      customerKraPin,
      customerDob,
      customerDeposit,
      customerTariffId,
      customerDiscoType,
      customerIdNo,
      hasSewer,
      hasWater,
      tariffCategoryId,
      customerSchemeId,
      customerZoneId,
      customerRouteId,
    } = req.body as CreateCustomerInput;

    const tenantId = req.user?.tenantId;
    const {id} = req.user!

    // Validate required fields
    if (!accountNumber || !customerName || !phoneNumber || !tenantId) {
      res.status(400).json({
        success: false,
        message: "accountNumber, customerName, phoneNumber, and tenantId are required.",
      });
      return;
    }

    // Check if customer already exists in the same tenant
    const existingCustomer = await prisma.customer.findFirst({
      where: { tenantId, accountNumber },
    });

    if (existingCustomer) {
      res.status(409).json({
        success: false,
        message: "Customer with this account number already exists for this tenant.",
      });
      return;
    }

    // Create new customer
 // In createCustomer
const customer = await prisma.customer.create({
  data: {
    accountNumber,
    customerName,
    email: email || undefined,
    phoneNumber,
    customerKraPin: customerKraPin || undefined,
    customerDob: customerDob ? new Date(customerDob) : undefined,
    customerDeposit: customerDeposit ? Number(customerDeposit) : undefined,
    customerTariffId: customerTariffId || undefined,
    customerDiscoType: customerDiscoType || undefined,
    customerIdNo: customerIdNo || undefined,
    hasSewer: hasSewer ?? false,
    hasWater: hasWater ?? true,
    tenantId,
    

    // These are Int?
    customerSchemeId: customerSchemeId ? Number(customerSchemeId) : null,
    customerZoneId: customerZoneId ? Number(customerZoneId) : null,
    customerRouteId: customerRouteId ? Number(customerRouteId) : null,

    // This is String? @db.Uuid → must be valid UUID or null
    tariffCategoryId: tariffCategoryId && tariffCategoryId.trim() !== "" ? tariffCategoryId.trim() : null,

    createdBy: id,
  },
});

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    next(error); // pass to error handler middleware
  }
};
