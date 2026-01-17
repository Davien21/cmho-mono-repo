/**
 * Reindex a single inventory item by name
 * Usage: tsx scripts/reindex-by-name.ts "Item Name"
 */

import algoliaInventoryService from "../src/services/algolia.service.js";
import InventoryItem from "../src/modules/inventory-items/inventory-items.model.js";
import mongoose from "mongoose";
import { env } from "../src/config/env.js";

async function reindexByName(itemName: string) {
  try {
    console.log(`\n🔍 Searching for item: "${itemName}"\n`);

    // Connect to MongoDB
    await mongoose.connect(env.DATABASE_URL);
    console.log("✅ Connected to MongoDB\n");

    // Find the item by name (case-insensitive)
    const item = await InventoryItem.findOne({
      name: { $regex: new RegExp(`^${itemName}$`, "i") },
      isDeleted: { $ne: true },
    });

    if (!item) {
      console.error(`❌ Item not found: "${itemName}"`);
      console.log(
        "\nTip: Make sure the name matches exactly (case-insensitive)"
      );
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log("📦 Found item:");
    console.log(`   ID: ${item._id}`);
    console.log(`   Name: ${item.name}`);
    console.log(`   Category: ${item.category?.name || "N/A"}`);
    console.log(`   Status: ${item.status}\n`);

    // Reindex in Algolia
    console.log("🔄 Reindexing in Algolia...");
    await algoliaInventoryService.indexItem(item);

    console.log(`✅ Successfully reindexed: ${item.name}\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Reindex failed:", error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

const itemName = process.argv[2];

if (!itemName) {
  console.error("❌ Please provide an item name");
  console.log('Usage: tsx scripts/reindex-by-name.ts "Item Name"');
  process.exit(1);
}

reindexByName(itemName);
