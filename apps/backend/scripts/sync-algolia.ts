/**
 * Algolia Sync Script
 *
 * This script syncs your MongoDB inventory items to Algolia search index.
 * Run this script when:
 * - First setting up Algolia
 * - After major data migrations
 * - If Algolia index gets out of sync with MongoDB
 *
 * Usage:
 *   pnpm sync-algolia
 *   # or
 *   NODE_ENV=production pnpm sync-algolia
 */

import algoliaInventoryService from "../src/services/algolia.service.js";
import mongoose from "mongoose";
import { env } from "../src/config/env.js";

async function syncToAlgolia() {
  try {
    console.log("\n🚀 Starting Algolia sync...\n");

    // Step 1: Connect to MongoDB
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(env.DATABASE_URL);
    console.log("✅ Connected to MongoDB\n");

    // Step 2: Clear existing Algolia index
    console.log("🗑️  Clearing existing Algolia index...");
    await algoliaInventoryService.clearIndex();
    console.log("✅ Index cleared\n");

    // Step 3: Configure Algolia index
    console.log("⚙️  Configuring Algolia index settings...");
    await algoliaInventoryService.configureIndex();
    console.log("✅ Index configured\n");

    // Step 4: Full reindex
    console.log("🔄 Starting full reindex...");
    await algoliaInventoryService.fullReindex();
    console.log("✅ Full reindex completed\n");

    console.log("🎉 Algolia sync completed successfully!");
    console.log(`📊 Index: ${algoliaInventoryService.getIndexName()}\n`);

    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Algolia sync failed:");
    console.error(error);

    // Attempt to close connection on error
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    process.exit(1);
  }
}

// Run the sync
syncToAlgolia();

