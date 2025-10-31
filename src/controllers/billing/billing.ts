import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/verifyToken";
import prisma from '../../globalPrisma'


export const generateBillsForActiveConnections = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const start = Date.now();

  try {
    const tenantId = req.user?.tenantId;
    const { billingPeriod: rawPeriod } = req.body;

    // ────── Validation ──────
    if (!tenantId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const billingPeriod = new Date(rawPeriod);
    if (isNaN(billingPeriod.getTime())) {
      res.status(400).json({ success: false, message: "Invalid billing period" });
      return;
    }

    // ────── Prevent duplicate run ──────
    const existing = await prisma.bill.count({
      where: {
        tenantId,
        billPeriod: billingPeriod,
        isSystemGenerated: true,
      },
    });
    if (existing > 0) {
      res.status(409).json({
        success: false,
        message: `Bills already generated for ${billingPeriod.toISOString().split("T")[0]}`,
      });
      return;
    }

    // ────── 1. Find connections that have a *billable* reading ──────
    const connections = await prisma.connection.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        customer: { status: "ACTIVE" },
        meter: {
          //status: "installed",
          meterReadings: {
            some: {
              status: "NORMAL",
              consumption: { gt: 0 },
            },
          },
        },
      },
      select: {
        id: true,
        customer: {
          select: {
            id: true,
            accountNumber: true,
            customerName: true,
            tariffCategoryId: true,
          },
        },
        meter: {
          select: {
            id: true,
            meterReadings: {
              where: { status: "NORMAL" },
              orderBy: { readingDate: "desc" },
              take: 1,                     // latest NORMAL reading
              select: { consumption: true, readingDate: true },
            },
          },
        },
      },
    });

    if (connections.length === 0) {
      res.status(200).json({ success: true, message: "No billable connections found." });
      return;
    }

    const billsToCreate: any[] = [];
    let processed = 0;
    let skipped = 0;

    // ────── 2. Build bill payload per connection ──────
    for (const conn of connections) {
      const reading = conn.meter?.meterReadings?.[0];
      const customer = conn.customer;

      if (!reading?.consumption || !customer) {
        skipped++;
        continue;
      }

      const consumption = Number(reading.consumption);
      processed++;

      // ---- Tariff blocks (tiered) ----
      const blocks = await prisma.tariffBlock.findMany({
        where: { categoryId: customer.tariffCategoryId! },
        orderBy: { minVolume: "asc" },
      });

      let remaining = consumption;
      let totalAmount = 0;
      const items: any[] = [];

      for (const b of blocks) {
        if (remaining <= 0) break;

        const upper = b.maxVolume ?? Infinity;
        const unitsInBlock = Math.min(
          remaining,
          upper - b.minVolume + (upper === Infinity ? 0 : 1)
        );

        if (unitsInBlock > 0) {
          const amount = unitsInBlock * b.ratePerUnit;
          totalAmount += amount;
          remaining -= unitsInBlock;

          items.push({
            description: `Water: ${b.minVolume}-${upper === Infinity ? "+" : upper} units @ ${b.ratePerUnit}/unit`,
            amount,
            quantity: unitsInBlock,
          });
        }
      }

      if (totalAmount === 0) {
        skipped++;
        continue;
      }

      // ---- Unique bill number ----
      const rand = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      const billNumber = `${customer.accountNumber}-${billingPeriod.getFullYear()}${String(
        billingPeriod.getMonth() + 1
      ).padStart(2, "0")}-${rand}`;

      billsToCreate.push({
        tenantId,
        billPeriod: billingPeriod,
        billNumber,
        billAmount: totalAmount,
        closingBalance: 0,
        status: "UNPAID",
        isSystemGenerated: true,
        customerId: customer.id,
        amountPaid: 0,
        typeid: null,
        items: { create: items },
      });
    }

    if (billsToCreate.length === 0) {
      res.status(200).json({
        success: true,
        message: "No billable consumption after tariff check.",
        stats: { processed, skipped },
      });
      return;
    }

    // ────── 3. Atomic creation ──────
    const created = await prisma.$transaction(async (tx) => {
      const result = [];
      for (const data of billsToCreate) {
        const bill = await tx.bill.create({
          data,
          select: {
            id: true,
            billNumber: true,
            billAmount: true,
            customer: { select: { accountNumber: true } },
          },
        });
        result.push(bill);
      }
      return result;
    });

    const duration = ((Date.now() - start) / 1000).toFixed(2);

    res.status(201).json({
      success: true,
      message: `${created.length} bill(s) generated in ${duration}s`,
      count: created.length,
      stats: { processed, skipped, totalConnections: connections.length },
      sampleBillNumbers: created.slice(0, 3).map((b: any) => b.billNumber),
    });
  } catch (err: any) {
    console.error("Bill generation error:", {
      tenantId: req.user?.tenantId,
      billingPeriod: req.body.billingPeriod,
      message: err.message,
      stack: err.stack,
    });
    next(err);
  }
};