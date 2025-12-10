import mongoose from "mongoose";
import bcrypt from "bcrypt";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import { env } from "../src/config/env";
import logger from "../src/config/logger";
import Admin from "../src/modules/admins/admins.model";
import { AdminRole } from "../src/modules/admins/admins.types";
import InventoryUnit from "../src/modules/inventory-units/inventory-units.model";
import InventoryCategory from "../src/modules/inventory-categories/inventory-categories.model";
import Supplier from "../src/modules/suppliers/suppliers.model";
import InventoryItem from "../src/modules/inventory-items/inventory-items.model";
import StockMovement from "../src/modules/stock-movement/stock-movement.model";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPER_ADMIN_EMAIL = "chidiebereekennia@gmail.com";
const SUPER_ADMIN_PASSWORD = "1234";

// Load seed data from JSON files
const unitsData: Array<{
  name: string;
  plural: string;
}> = JSON.parse(fs.readFileSync(path.join(__dirname, "units.json"), "utf-8"));

const categoriesData: Array<{
  name: string;
  unitPreset: string;
  canBeSold: boolean;
}> = JSON.parse(
  fs.readFileSync(path.join(__dirname, "categories.json"), "utf-8")
);

const SUPPLIER_SEEDS = [
  { name: "MedSupply Nigeria Ltd" },
  { name: "PharmaCare Distributors" },
  { name: "HealthLine Logistics" },
  { name: "Global Medical Supplies" },
  { name: "Unity Pharmaceuticals" },
] as const;

async function clearAllData() {
  logger.info("Clearing all existing data...");

  try {
    // Clear all collections
    await Admin.deleteMany({});
    logger.info("✓ Cleared admins collection");

    await InventoryUnit.deleteMany({});
    logger.info("✓ Cleared inventory units collection");

    await InventoryCategory.deleteMany({});
    logger.info("✓ Cleared inventory categories collection");

    await Supplier.deleteMany({});
    logger.info("✓ Cleared suppliers collection");

    await InventoryItem.deleteMany({});
    logger.info("✓ Cleared inventory items collection");

    await StockMovement.deleteMany({});
    logger.info("✓ Cleared stock movements collection");

    logger.info("All data cleared successfully!");
  } catch (error) {
    logger.error(`Error clearing data: ${error}`);
    throw error;
  }
}

async function seedSuperAdmin() {
  const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

  await Admin.create({
    name: "Chidiebere Ekennia",
    email: SUPER_ADMIN_EMAIL,
    passwordHash,
    isSuperAdmin: true,
    roles: [AdminRole.INVENTORY_MANAGER],
    status: "active",
  });

  logger.info(
    `Seeded super admin with email ${SUPER_ADMIN_EMAIL} and default password.`
  );
}

async function seedInventoryPresets() {
  // 1. Seed units
  const unitsByName = new Map<string, mongoose.Types.ObjectId>();

  for (const unitData of unitsData) {
    const unit = await InventoryUnit.create({
      name: unitData.name,
      plural: unitData.plural,
    });

    logger.info(
      `Seeded inventory unit "${unitData.name}" (plural: "${unitData.plural}")`
    );
    unitsByName.set(unitData.name, unit._id);
  }

  // 2. Seed categories using the units above
  for (const category of categoriesData) {
    // Parse unitPreset string (e.g., "Pack -> Card -> Tablet") into array of unit names
    const unitNames = category.unitPreset
      .split("->")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    // Find unit doc IDs in the correct sequence
    const unitPresetIds = unitNames
      .map((name) => unitsByName.get(name))
      .filter((id): id is mongoose.Types.ObjectId => Boolean(id));

    if (unitPresetIds.length !== unitNames.length) {
      logger.error(
        `Some units not found for category "${category.name}": expected ${unitNames.length}, found ${unitPresetIds.length}`
      );
    }

    await InventoryCategory.create({
      name: category.name,
      unitPresetIds,
      canBeSold: category.canBeSold,
    });

    logger.info(
      `Seeded inventory category "${category.name}" with unit preset: ${category.unitPreset}`
    );
  }
}

async function seedSuppliers() {
  for (const seed of SUPPLIER_SEEDS) {
    await Supplier.create({
      name: seed.name,
    });

    logger.info(`Seeded supplier "${seed.name}"`);
  }
}

interface InventoryItemSeed {
  name: string;
  category: string;
  earliestExpiryDate?: string;
  laterExpiryDates?: string[];
  quantities?: Array<{ name: string; quantity: number }>;
  units?: Array<{ name: string; plural: string; quantity: number }>;
}

async function seedInventoryItems() {
  // Get super admin for createdBy field
  const superAdmin = await Admin.findOne({ email: SUPER_ADMIN_EMAIL });
  if (!superAdmin) {
    logger.error("Super admin not found. Cannot seed inventory items.");
    return;
  }

  // Get all categories and units for mapping
  const categories = await InventoryCategory.find();
  const categoryMap = new Map<string, any>();
  for (const cat of categories) {
    categoryMap.set(cat.name, {
      _id: cat._id,
      name: cat.name,
    });
  }

  const units = await InventoryUnit.find();
  const unitMap = new Map<string, mongoose.Types.ObjectId>();
  for (const unit of units) {
    unitMap.set(unit.name, unit._id);
  }

  // Load inventory JSON files
  const inventoryFiles = [
    "drugs.json",
    "ointments.json",
    "injections.json",
    "suspensions-and-syrups.json",
    "infusions.json",
    "consumables.json",
  ];

  let totalCreated = 0;

  for (const filename of inventoryFiles) {
    const filePath = path.join(__dirname, "inventory", filename);

    if (!fs.existsSync(filePath)) {
      logger.error(`Inventory file not found: ${filename}`);
      continue;
    }

    const items: InventoryItemSeed[] = JSON.parse(
      fs.readFileSync(filePath, "utf-8")
    );

    logger.info(`Processing ${items.length} items from ${filename}...`);

    for (const item of items) {
      // Map category
      const categoryData = categoryMap.get(item.category);
      if (!categoryData) {
        logger.error(
          `Category "${item.category}" not found for item "${item.name}". Skipping.`
        );
        continue;
      }

      // Transform units structure - use real unit doc IDs from DB
      const transformedUnits = (item.units || [])
        .map((unit) => {
          const unitId = unitMap.get(unit.name);
          if (!unitId) {
            logger.error(
              `Unit "${unit.name}" not found for item "${item.name}".`
            );
            return null;
          }

          return {
            id: unitId.toString(),
            presetId: unitId.toString(),
            name: unit.name,
            plural: unit.plural,
            quantity: unit.quantity,
          };
        })
        .filter((unit): unit is NonNullable<typeof unit> => unit !== null);

      // Calculate currentStockInBaseUnits from quantities
      let currentStockInBaseUnits = 0;
      if (item.quantities && item.quantities.length > 0) {
        // The base unit is the last unit in the array (smallest unit)
        const baseQuantity =
          item.quantities[item.quantities.length - 1]?.quantity || 0;
        currentStockInBaseUnits = baseQuantity;
      }

      // Create inventory item
      const createdItem = await InventoryItem.create({
        name: item.name,
        category: categoryData,
        units: transformedUnits,
        status: "active",
        createdBy: superAdmin._id,
        currentStockInBaseUnits,
        canBeSold: categoryData.name !== "Consumable",
        isDeleted: false,
      });

      // Create initial stock movement entries for all expiry dates
      if (currentStockInBaseUnits > 0) {
        const expiryDates: string[] = [];

        // Add earliest expiry date if it exists
        if (item.earliestExpiryDate && item.earliestExpiryDate.trim() !== "") {
          expiryDates.push(item.earliestExpiryDate);
        }

        // Add later expiry dates if they exist
        if (item.laterExpiryDates && item.laterExpiryDates.length > 0) {
          expiryDates.push(
            ...item.laterExpiryDates.filter((d) => d && d.trim() !== "")
          );
        }

        // Create a stock movement for the earliest expiry date with all the stock
        // (In reality, stock would be distributed across batches, but for seeding we'll use one entry)
        if (expiryDates.length > 0) {
          try {
            const expiryDate = new Date(expiryDates[0]);

            await StockMovement.create({
              inventoryItemId: createdItem._id,
              operationType: "add",
              supplier: null, // No supplier for seed data
              costPrice: 0, // Default placeholder
              sellingPrice: 0, // Default placeholder
              expiryDate: expiryDate,
              quantityInBaseUnits: currentStockInBaseUnits,
              balance: currentStockInBaseUnits,
              performerId: superAdmin._id,
              performerName: "Seed Script",
            });
          } catch (error) {
            logger.error(
              `Failed to create stock movement for "${item.name}": ${error}`
            );
          }
        }
      }

      totalCreated++;
    }

    logger.info(`Created ${totalCreated} items from ${filename}`);
  }

  logger.info(`Total inventory items seeded: ${totalCreated}`);
}

async function runSeeds() {
  await mongoose.connect(env.DATABASE_URL);

  try {
    // Clear all existing data first
    await clearAllData();

    // Seed fresh data
    await seedSuperAdmin();
    await seedInventoryPresets();
    await seedSuppliers();
    await seedInventoryItems();

    logger.info("✓ All seed data inserted successfully!");
  } catch (error) {
    logger.error(`Error running seed script: ${error}`);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

runSeeds()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
