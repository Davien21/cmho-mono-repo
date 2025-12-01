import mongoose from "mongoose";
import bcrypt from "bcrypt";

import { env } from "../src/config/env";
import logger from "../src/config/logger";
import Admin from "../src/modules/admins/admins.model";
import { AdminRole } from "../src/modules/admins/admins.types";
import InventoryUnit from "../src/modules/inventory-units/inventory-units.model";
import InventoryCategory from "../src/modules/inventory-categories/inventory-categories.model";

const SUPER_ADMIN_EMAIL = "chidiebereekennia@gmail.com";
const SUPER_ADMIN_PASSWORD = "1234";

const INVENTORY_UNIT_SEEDS = [
  { name: "Pack", plural: "Packs" },
  { name: "Card", plural: "Cards" },
  { name: "Tablet", plural: "Tablets" },
  { name: "Bottle", plural: "Bottles" },
  { name: "Piece", plural: "Pieces" },
] as const;

const INVENTORY_CATEGORY_SEEDS = [
  {
    name: "Drug",
    unitNames: ["Pack", "Card", "Tablet"],
  },
  {
    name: "Injection",
    unitNames: ["Pack", "Bottle"],
  },
  {
    name: "Syrup",
    unitNames: ["Bottle"],
  },
  {
    name: "Bottle",
    unitNames: ["Bottle"],
  },
  {
    name: "Consumable",
    unitNames: ["Piece"],
  },
] as const;

async function seedSuperAdmin() {
  const existing = await Admin.findOne({ email: SUPER_ADMIN_EMAIL });

  if (existing) {
    logger.info(
      `Super admin already exists with email ${SUPER_ADMIN_EMAIL}, skipping creation.`
    );
    return;
  }

  const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

  await Admin.create({
    name: "Super Admin",
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

  for (const seed of INVENTORY_UNIT_SEEDS) {
    const existing = await InventoryUnit.findOne({ name: seed.name });

    if (existing) {
      // Keep plural name in sync but avoid noisy logs
      if (existing.plural !== seed.plural) {
        existing.plural = seed.plural;
        await existing.save();
      }
      unitsByName.set(seed.name, existing._id);
      continue;
    }

    const created = await InventoryUnit.create({
      name: seed.name,
      plural: seed.plural,
    });

    logger.info(`Seeded inventory unit "${seed.name}"`);
    unitsByName.set(seed.name, created._id);
  }

  // 2. Seed categories using the units above
  for (const seed of INVENTORY_CATEGORY_SEEDS) {
    const unitPresetIds = seed.unitNames
      .map((name) => unitsByName.get(name))
      .filter((id): id is mongoose.Types.ObjectId => Boolean(id));

    const existing = await InventoryCategory.findOne({ name: seed.name });

    if (existing) {
      existing.unitPresetIds = unitPresetIds;
      await existing.save();
      logger.info(`Updated inventory category "${seed.name}"`);
      continue;
    }

    await InventoryCategory.create({
      name: seed.name,
      unitPresetIds,
    });

    logger.info(`Seeded inventory category "${seed.name}"`);
  }
}

async function runSeeds() {
  await mongoose.connect(env.DATABASE_URL);

  try {
    await seedSuperAdmin();
    await seedInventoryPresets();
  } catch (error) {
    logger.error("Error running seed script", error);
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
