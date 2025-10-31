// src/helpers/getTariffCostPerUnit.ts
import prisma from "../../globalPrisma";

/**
 * Returns the tariff block and rate per unit based on the customer's tariff category and consumption.
 * 
 * @param customerId - UUID of the customer
 * @param consumption - Units consumed during the billing period
 * @returns { ratePerUnit: number, tariffBlock: TariffBlock | null }
 */
export const getTariffCostPerUnit = async (customerId: string, consumption: number) => {
  try {
    // 1️⃣ Fetch the customer with tariff category and related tariff blocks
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        tariffCategory: {
          include: { blocks: true },
        },
      },
    });

    if (!customer?.tariffCategory?.blocks?.length) {
      console.warn(`No tariff blocks found for customer ${customerId}`);
      return { ratePerUnit: 0, tariffBlock: null };
    }

    // 2️⃣ Find the appropriate tariff block based on consumption
    const matchingBlock = customer.tariffCategory.blocks.find(
      (block) =>
        consumption >= block.minVolume &&
        (block.maxVolume === null || consumption <= block.maxVolume)
    );

    if (!matchingBlock) {
      console.warn(`No matching tariff block found for consumption ${consumption}`);
      return { ratePerUnit: 0, tariffBlock: null };
    }

    // 3️⃣ Return rate and tariff block info
    return {
      ratePerUnit: matchingBlock.ratePerUnit,
      tariffBlock: matchingBlock,
    };
  } catch (error) {
    console.error("Error calculating tariff cost per unit:", error);
    throw error;
  }
};
