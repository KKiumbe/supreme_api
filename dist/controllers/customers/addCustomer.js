"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomer = void 0;
const globalPrisma_1 = __importDefault(require("../../globalPrisma"));
// Create Customer Controller
const createCustomer = async (req, res, next) => {
    try {
        const { accountNumber, customerName, email, phoneNumber, customerKraPin, customerDob, customerDeposit, customerTariffId, customerDiscoType, customerIdNo, hasSewer, hasWater, tariffCategoryId, customerSchemeId, customerZoneId, customerRouteId, } = req.body;
        const tenantId = req.user?.tenantId;
        const { id } = req.user;
        // Validate required fields
        if (!accountNumber || !customerName || !phoneNumber || !tenantId) {
            res.status(400).json({
                success: false,
                message: "accountNumber, customerName, phoneNumber, and tenantId are required.",
            });
            return;
        }
        // Check if customer already exists in the same tenant
        const existingCustomer = await globalPrisma_1.default.customer.findFirst({
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
        const customer = await globalPrisma_1.default.customer.create({
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
    }
    catch (error) {
        console.error("Error creating customer:", error);
        next(error); // pass to error handler middleware
    }
};
exports.createCustomer = createCustomer;
